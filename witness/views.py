from django.shortcuts import render
from django.http import HttpResponse


# def index(request):
#     html = (
#         "<html><body><h1>Imagine there's a list of blog posts here!</h1></body></html>"
#     )
#     return HttpResponse(html, charset="utf-8")


# Create your views here.
def index(request):

    pagetitle = 'title'
    template = loader.get_template('witness/index.html')

    #### update this to remove databasecall

    manifestation_total = Manifestation.objects.count()
    seal_total = Seal.objects.count()
    #item_total = Support.objects.distinct('fk_part__fk_item').count()
    item_total = 53408
    catalogue_total = Sealdescription.objects.count()

    context = {
        'pagetitle': pagetitle,
        'londoners_total': manifestation_total,
        'seal_total': seal_total,
        'item_total': item_total,
        }

    return HttpResponse(template.render(context, request))