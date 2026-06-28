"""
URL configuration for lawa_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path("sensors/", include("api.urls")),
    path("reports/", include("reports.urls")),
    path("auth/", include("authentication.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# curl -X POST -F "title=2021 Q1" -F "pdf=@2021q1.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2021 Q2" -F "pdf=@2021q2.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2021 Q3" -F "pdf=@2021q3.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2021 Q4" -F "pdf=@2021q4.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2022 Q1" -F "pdf=@2022q1.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2022 Q2" -F "pdf=@2022q2.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2022 Q3" -F "pdf=@2022q3.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2022 Q4" -F "pdf=@2022q4.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2023 Q1" -F "pdf=@2023q1.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2023 Q2" -F "pdf=@2023q2.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2023 Q3" -F "pdf=@2023q3.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2023 Q4" -F "pdf=@2023q4.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2024 Q1" -F "pdf=@2024q1.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2024 Q2" -F "pdf=@2024q2.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2024 Q3" -F "pdf=@2024q3.pdf" https://api.projectlawa.org/reports/upload/
# curl -X POST -F "title=2024 Q4" -F "pdf=@2024q4.pdf" https://api.projectlawa.org/reports/upload/