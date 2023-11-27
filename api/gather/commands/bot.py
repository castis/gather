from datetime import datetime
from typing import Optional

import openai
import requests
from models import Comment


class Behavior:
    token: str = ""

    # given a string like "/token 4 horses merged into 1 elephant-sized duck"
    # would just shave off the "/token "
    def get_prompt(self, comment: Comment) -> str:
        return comment.content[len(self.token) + 2 :]

    # returns the html we wish to respond with
    def process(self, comment: Comment) -> Optional[str]:
        return None


generated_dir = "/opt/yayhooray/generated/"


def quotewrap(name, prompt):
    return f'<blockquote title="{name}">{prompt}</blockquote>\n'


class ImageGenerator(Behavior):
    token = "image-gen"

    def process(self, comment: Comment) -> Optional[str]:
        prompt = self.get_prompt(comment)
        quote = quotewrap(comment.author.name, prompt)

        try:
            response = openai.Image.create(
                prompt=prompt,
                n=1,
                size="1024x1024",
            )
        except openai.error.InvalidRequestError:
            return f"{quote}InvalidRequestError"
        except openai.error.RateLimitError:
            return f"{quote}RateLimitError"
        except openai.error.APIError:
            return f"{quote}APIError"

        if response.created > 0:
            image = requests.get(response.data[0].url)
            timestamp = int(round(datetime.now().timestamp()))
            slug = f"{comment.author.slug}_{timestamp}.png"

            with open(f"{generated_dir}{slug}", "wb") as img_file:
                img_file.write(image.content)

            url = f"https://generated.duckbo.at/{slug}"
            return f'{quote}<img src="{url}" width="600" title="{prompt}">'
        return None


class TextGenerator(Behavior):
    token = "text-gen"

    def process(self, comment: Comment) -> Optional[str]:
        prompt = self.get_prompt(comment)
        quote = quotewrap(comment.author.name, prompt)

        try:
            response = openai.Completion.create(
                model="text-davinci-003",
                prompt=prompt,
                max_tokens=100,
                temperature=0.4,
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


behaviors = [
    ImageGenerator(),
    TextGenerator(),
]


# # flask app applications
# @commands.cli.command("bot")
# def do_bot_stuff():
#     click.echo("asdfadsjk")
#     sleep(1000)
