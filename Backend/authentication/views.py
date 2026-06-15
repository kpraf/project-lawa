from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
import json
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.template.loader import render_to_string
from django.core.mail import EmailMessage, get_connection
from django.core.cache import cache
from datetime import datetime
from api.helper.email import report_log
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer


def email_otp(code, email, expiry):
    try:
        html_message = render_to_string('otp.html', {
            'email': email,
            'otp_code': code,
            'expiry': expiry,
        })

        zepto_connection = get_connection(
            host='smtp.zeptomail.com',
            port=465,
            username = "emailapikey",
            password= "wSsVR61yrxLwDK57nGCrdbw/zFVTBVulQEV/0VHyuif/H/DK9cc5kkLMAFWgG6UYEzZoHWFD8e4qzhcGhmYMhtUpmAoJCSiF9mqRe1U4J3x17qnvhDzIV2pdkRGKLooJwwprnGNoFcor+g==",
            
        )
        
        msg = EmailMessage(
            subject= "🔐 OTP for " + email,
            body=html_message,
            from_email='noreply@projectlawa.org',
            to=['borgepaguirigan@gmail.com', 'senalmazora@gmail.com', 'cjdumlao14@gmail.com','jensenalmazora@gmail.com', email],
            connection=zepto_connection
        )
        msg.content_subtype = "html"
        msg.send()

        report_log(True, "OTP Email Sent Successfully")
        return JsonResponse({"message": "OTP sent successfully",
                             "success": True}, status=200)

    except Exception as e:
        print(f"Error sending OTP email: {e}")
        report_log(False, e)
        return JsonResponse({"message": "Failed to send OTP email. Try Again",
                             "success": False}, status=500)


def generate_otp():
    import random
    code = "".join([str(random.randint(0, 9)) for _ in range(6)])

    return code


@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        email = body.get('email')
        password = body.get('password')

        if not email:
            return JsonResponse({"message": "Email Field is Required!",
                                 "success": False},
                                 status=400) 
        
        if not password:
            return JsonResponse({"message": "Password Field is Required!",
                                 "success": False},
                                 status=400)
        try:
            user = User.objects.get(email=email)
        
        except User.DoesNotExist:
            return JsonResponse({"message": "Email not found",
                                 "success": False},
                                 status=404)
        
        user = authenticate(request, username=user.username, password=password)

        if user is None:
            return JsonResponse({"message": "Invalid credentials",
                                 "success": False},
                                 status=401)
        
        otp = generate_otp()

        cache_otp = "otp_" + user.username
        cache.set(cache_otp, {
            'otp': otp,
            'created_at': datetime.now().isoformat(),
            'attempts': 0,
        }, timeout=300)


        return email_otp(otp, email, 5)

    return JsonResponse({'error': 'Method not allowed'}, status=405)



@csrf_exempt
def verify_otp(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        username = body.get('username')
        otp = body.get('otp')

        if not username or not otp:
            return JsonResponse({"message": "Email and OTP are required",
                                 "success": False}, status=400)

        try:
            user = User.objects.get(username=username)
        
            cache_otp = "otp_" + username
            cached_data = cache.get(cache_otp)


            if not cached_data:
                return JsonResponse({"message": "OTP expired or invalid",
                                     "success": False}, status=400)

            if cached_data['attempts'] >= 3:
                return JsonResponse({"message": "Too many attempts, please request another OTP",
                                     "success": False}, status=429)


            if cached_data['otp'] != otp:
                cached_data['attempts'] += 1
                cache.set(cache_otp, cached_data, timeout=300)
                return JsonResponse({"message": "Invalid OTP",
                                     "success": False}, status=400)


            login(request, user)
            cache.delete(cache_otp)

            role = user.username.split('@')[0]

            token = RefreshToken.for_user(user)
            access_token = str(token.access_token)
            refresh_token = str(token)

            
            return JsonResponse({"message": "Login successful",
                                 "success": True,
                                 "role": role,
                                 "email": user.username,
                                 "access": access_token,
                                 "refresh": refresh_token}, status=200)
        
        except User.DoesNotExist:
            return JsonResponse({"message": "User not found",
                                 "success": False}, status=404)

        except Exception as e:
            return JsonResponse({"message": "An error occurred: "+ str(e) +"\nTry again.",
                                 "success": False}, status=500)


    return JsonResponse({'message': 'Method not allowed',
                         "success": False}, status=405)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    role = request.user.username.split('@')[0]
    return JsonResponse({
        "message": "Token is valid",
        "success": True,
        "role": role,
        "email": request.user.username
    }, status=200)


class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = TokenRefreshSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            access = serializer.validated_data['access']

            refresh = RefreshToken(request.data['refresh'])
            user = User.objects.get(id=refresh['user_id'])
            return JsonResponse({
                'access': access,
                'refresh': str(refresh),
                'success': True,
                'email': user.email,
                'user': user.email.split('@')[0],
            }, status=200)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)