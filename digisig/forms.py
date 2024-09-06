from django import forms
# from django.db.models import Count
# from django.db.models import Q

from .models import * 

#Form for querying seal impressions
repositories_options = [('','None')]
series_options = [('', 'None')]
location_options = []
nature_options = []
representation_options = [('', 'None')]
timegroup_options = [('', 'None')]
shape_options = [('', 'None')]
classname_options = [('', 'None')]
group_options = [('', 'None')]

for e in Printgroup.objects.order_by('printgroup_order'):
	group_options.append((e.pk_printgroup, e.printgroup))

for e in Repository.objects.order_by('repository_fulltitle'):
	repositories_options.append((e.fk_repository, e.repository_fulltitle))

for e in Series.objects.order_by('series_name').distinct('series_name'):
	appendvalue = str(e.fk_repository) + " : " + e.series_name
	series_options.append((e.pk_series, appendvalue))

for e in Region.objects.order_by('region_label').distinct('region_label'):
	location_options.append((e.pk_region, e.region_label))

for e in Nature.objects.order_by('nature_name').distinct('nature_name'):
	nature_options.append((e.pk_nature, e.nature_name))

for e in RepresentationType.objects.order_by('representation_type').distinct('representation_type').exclude(pk_representation_type=5):
	representation_options.append((e.pk_representation_type, e.representation_type))
	
for e in TimegroupC.objects.order_by('pk_timegroup_c'):
	timegroup_options.append((e.timegroup_c, e.timegroup_c_range))

for e in Shape.objects.order_by('shape').distinct('shape'):
	shape_options.append((e.pk_shape, e.shape))

for e in Terminology.objects.filter(term_type=1).order_by('term_name').distinct('term_name'):
	classname_options.append((e.id_term, e.term_name))

class ManifestationForm(forms.Form):
	repository = forms.ChoiceField(choices=repositories_options, required=False)
	series = forms.ChoiceField(choices=series_options, required=False, initial={'': 'None'})	
	location = forms.ChoiceField(choices=location_options, required=False)
	nature = forms.ChoiceField(label='Object', choices=nature_options, required=False)
	representation = forms.ChoiceField(choices=representation_options, required=False, initial={'': 'None'})
	timegroup = forms.ChoiceField(label='Period', choices=timegroup_options, required=False)
	shape = forms.ChoiceField(choices=shape_options, required=False, initial={'': 'None'})
	name = forms.CharField(label='Identifier', max_length=100, required=False, widget=forms.TextInput(attrs={'placeholder': 'Example: BA 867 box 21'}))
	classname = forms.ChoiceField(label='Digisig Class', choices=classname_options, required=False)
	pagination = forms.IntegerField(initial=1, widget=forms.HiddenInput)
	group = forms.ChoiceField(choices=group_options, required=False, initial={'': 'None'})