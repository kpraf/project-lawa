from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Get a value from a dict in a template."""
    if dictionary:
        return dictionary.get(key)
    return None