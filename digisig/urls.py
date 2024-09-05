from django.urls import path, re_path
from debug_toolbar.toolbar import debug_toolbar_urls

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('search/<str:searchtype>', views.search, name='search'),
] + debug_toolbar_urls()