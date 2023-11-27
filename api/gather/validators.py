from email_validator import EmailNotValidError
from email_validator import validate_email as external_validate_email
from gather.models import User
from webargs import ValidationError, fields


def validate_name(name):
    if len(name) < 2:
        raise ValidationError("Too short.")
    if not name.isalnum():
        raise ValidationError("Invalid.")
    if User.query.filter_by(name=name).first():
        raise ValidationError("Taken.")


def validate_email(email, **kwargs):
    if User.query.filter_by(email=email).first():
        raise ValidationError("Taken.")

    try:
        return external_validate_email(email, **kwargs)
    except EmailNotValidError as e:
        raise ValidationError(str(e))


def validate_password(password):
    if len(password) < 6:
        raise ValidationError("Too short.")
    # TODO: complexity?

def password_complexity(password):
    if len(password) < 8:
        return False  # password length should be at least 8 characters
    # if not re.search("[a-z]", password):
    #     return False  # at least one lowercase letter
    # if not re.search("[A-Z]", password):
    #     return False  # at least one uppercase letter
    # if not re.search("[0-9]", password):
    #     return False  # at least one digit
    # if not re.search("[!@#$%^&*()_+]", password):
    #     return False  # at least one special character
    return True
