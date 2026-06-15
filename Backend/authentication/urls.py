from django.urls import path
from .views import login_view, verify_otp, verify_token, CustomTokenRefreshView


urlpatterns = [
    path("login/", login_view, name="login"),
    path("otp/", verify_otp, name="verify_otp"),
    path("verify/", verify_token, name="verify_token"),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh')
]