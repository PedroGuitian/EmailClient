from django.contrib import admin
from .models import User, Email

# Register User model with custom admin view
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_active')
    search_fields = ('username', 'email')
    list_filter = ('is_active', 'is_staff')

# Register Email model with custom admin view
@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'sender', 'timestamp', 'read')
    list_filter = ('read', 'archived')
    search_fields = ('subject', 'body')
    readonly_fields = ('timestamp',)