import zipfile
from django.contrib import admin
from django import forms
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.urls import path
from django.contrib import messages
from io import BytesIO
from .models import PreGeneratedQR, Pet

class GenerateBatchForm(forms.Form):
    quantity = forms.IntegerField(min_value=1, max_value=100, initial=1, label="Cantidad de QRs")

@admin.register(PreGeneratedQR)
class PreGeneratedQRAdmin(admin.ModelAdmin):
    list_display = ('qr_uuid', 'is_assigned', 'is_printed', 'created_at', 'qr_code')
    list_filter = ('is_assigned', 'is_printed', 'created_at')
    search_fields = ('qr_uuid',)
    actions = ['mark_as_printed', 'export_unused_qrs']
    readonly_fields = ('qr_uuid', 'qr_code', 'created_at')

    def generate_batch(self, request, queryset=None):
        if 'apply' in request.POST:
            form = GenerateBatchForm(request.POST)
            if form.is_valid():
                quantity = form.cleaned_data['quantity']
                try:
                    created_qrs = []
                    for _ in range(quantity):
                        qr = PreGeneratedQR()
                        qr.save()
                        created_qrs.append(qr)
                    messages.success(request, f"Se generaron {quantity} códigos QR exitosamente.")
                    return redirect('admin:api_pregeneratedqr_changelist')
                except Exception as e:
                    messages.error(request, f"Error al generar QRs: {str(e)}")
            else:
                messages.error(request, "Cantidad inválida.")
        return render(request, 'admin/generate_batch_form.html', {
            'form': GenerateBatchForm(),
            'title': 'Generar Lote de QRs',
        })

    def mark_as_printed(self, request, queryset):
        updated = queryset.filter(is_assigned=False).update(is_printed=True)
        if updated:
            self.message_user(request, f"Se marcaron {updated} QR como impresos.")
        else:
            self.message_user(request, "No se actualizaron QR. Asegúrate de que no estén asignados.", level='warning')

    mark_as_printed.short_description = "Marcar como impresos"

    def export_unused_qrs(self, request, queryset):
        unused_qrs = PreGeneratedQR.objects.filter(is_assigned=False, is_printed=False)
        if not unused_qrs.exists():
            self.message_user(request, "No hay QR no usados y no impresos para exportar.", level='warning')
            return

        buffer = BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for qr in unused_qrs:
                if qr.qr_code:
                    with open(qr.qr_code.path, 'rb') as img_file:
                        zip_file.writestr(f"pre_qr_{qr.qr_uuid}.png", img_file.read())
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename=unused_qrs.zip'
        return response

    export_unused_qrs.short_description = "Exportar QR no usados y no impresos como ZIP"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('generate-batch/', self.admin_site.admin_view(self.generate_batch), name='api_pregeneratedqr_generate_batch'),
        ]
        return custom_urls + urls

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'qr_uuid', 'qr_code', 'is_lost', 'created_at')
    list_filter = ('is_lost', 'created_at')
    search_fields = ('name', 'qr_uuid', 'owner__username')