from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Add a new user to the system"

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email address for the new user')
        parser.add_argument('password', type=str, help='Password for the new user')

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        if User.objects.filter(username=email).exists():
            self.stdout.write(self.style.ERROR(f"User '{email}' already exists."))
            return
        try:
            user = User.objects.create_user(username=email, email=email, password=password)
            user.save()

            self.stdout.write(self.style.SUCCESS(f"User '{email}' created successfully."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error creating user '{email}': {str(e)}"))
            