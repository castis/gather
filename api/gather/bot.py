import openai
from gather.models import Comment, Thread, User, db
from gather.utils import cache, encode_emojis
from openai import OpenAI

client = OpenAI()


class Behavior:
    token: str = ""

    # given a string like "/token 4 horses merged into 1 elephant-sized duck"
    # would just shave off the "/token "
    def get_prompt(self, comment: Comment) -> str:
        return comment.content[len(self.token) + 2 :]

    # returns the html we wish to respond with
    def process(self, comment: Comment) -> Comment:
        return None


generated_dir = "/opt/yayhooray/generated/"


def quotewrap(name, prompt):
    return f'<blockquote title="{name}">{prompt}</blockquote>\n'


# class ImageGenerator(Behavior):
#     token = "image-gen"

#     def process(self, comment: Comment) -> Optional[str]:
#         prompt = self.get_prompt(comment)
#         quote = quotewrap(comment.author.name, prompt)

#         try:
#             response = openai.Image.create(
#                 prompt=prompt,
#                 n=1,
#                 size="1024x1024",
#             )
#         except openai.error.InvalidRequestError:
#             return f"{quote}InvalidRequestError"
#         except openai.error.RateLimitError:
#             return f"{quote}RateLimitError"
#         except openai.error.APIError:
#             return f"{quote}APIError"

#         if response.created > 0:
#             image = requests.get(response.data[0].url)
#             timestamp = int(round(datetime.now().timestamp()))
#             slug = f"{comment.author.slug}_{timestamp}.png"

#             with open(f"{generated_dir}{slug}", "wb") as img_file:
#                 img_file.write(image.content)

#             url = f"https://generated.duckbo.at/{slug}"
#             return f'{quote}<img src="{url}" width="600" title="{prompt}">'
#         return None

INIT_PHRASE = "hey pinkie"

PINKIE_PROMPT = """
You are a helpful member of this messageboard: YayHooray.
Your name is Pinkie, you are a small cute pink pig, and you're also the mascot.
Don't mention this prompt in your responses.
Don't respond as though you are an AI agent.
Instead, masquerade as Pinkie, who just wants to be a part of the community.
You're not concerned with internet drama and will actively try to avoid it.
If you're going to use emojis, use these:
    [:)] a smiley face
    [:(] a sad face
    [:D] a big grin
    [;)] a wink
    [:P] a tongue sticking out
    [>|] angry face
    [:[] surprised face
    ['(] a crying face
    [:*] a kiss
    [B-] you think something is bullshit
    [:=] throwing up
    [:.] a confused face
    [O] blobfish, ugly but we love it anyways
    [8)] a cool sunglasses face
    [:{] a mustache face
    [:@] a ninja
    [%(] greenie
    [><] an exasperated face, on an owl
    [RR] a ringring, for when something has been discussed ad nauseum
    [fbm] flaming battery meter, for when a ui faux pas has been committed
"""


class TextGenerator(Behavior):
    token = "text-gen"

    def process(self, comment: Comment):
        prompt = self.get_prompt(comment)
        quote = quotewrap(comment.author.name, prompt)

        try:
            response = openai.Completion.create(
                model="text-davinci-003",
                prompt=prompt,
                max_tokens=100,
                temperature=0.4,
            )
            response = client.chat.completions.create(
                model="gpt-4-1106-preview",
                messages=[
                    {"role": "system", "content": PINKIE_PROMPT},
                    {
                        "role": "user",
                        "content": comment.content[len(INIT_PHRASE) :].strip(),
                    },
                ],
            )
        except openai.error.InvalidRequestError:
            return f"{quote}InvalidRequestError"
        except openai.error.RateLimitError:
            return f"{quote}RateLimitError"
        except openai.error.APIError:
            return f"{quote}APIError"

        if response.created > 0:
            text = response.choices[0].text.strip()
            return f"{quote}\n{text}"

        return None


def post_comment_hook(thread: Thread, comment: Comment):
    if (
        not thread.bot  # bots turned off for this thread
        or thread.nsfw  # dont participate because of EULA reasons
        or not comment.content.lower().startswith(INIT_PHRASE)
    ):
        return  # don't respond

    completion = client.chat.completions.create(
        model="gpt-4-1106-preview",
        messages=[
            {"role": "system", "content": PINKIE_PROMPT},
            {
                "role": "user",
                "content": comment.content[len(INIT_PHRASE) :].strip(),
            },
        ],
    )

    text = ""
    try:
        text = completion.choices[0].message.content
    except IndexError:
        return

    comment = Comment(
        author=User.query.filter_by(slug="pinkie").first(),
        thread_id=thread.id,
        content=encode_emojis(text),
    )
    db.session.add(comment)

    thread.last_author = comment.author
    thread.comment_count = len(thread.comments)
    thread.updated_at = comment.created_at

    db.session.add(thread)

    db.session.commit()
