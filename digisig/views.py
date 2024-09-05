from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time

from .models import *



# Create your views here.
def index(request):
    # return render(request, 'sealquery/index.html', {})

    starttime = time()

    pagetitle = 'title'
    template = loader.get_template('digisig/index.html')

    #### update this to remove databasecall

    manifestation_total = Manifestation.objects.count()
    seal_total = Seal.objects.count()
    item_total = Manifestation.objects.distinct('fk_support__fk_part__fk_item').count()
    catalogue_total = Sealdescription.objects.count()

    context = {
        'pagetitle': pagetitle,
        'manifestation_total': manifestation_total,
        'seal_total': seal_total,
        'item_total': item_total,
        'catalogue_total': catalogue_total,
        }

    print("Compute Time:", time()-starttime)
    return HttpResponse(template.render(context, request))
