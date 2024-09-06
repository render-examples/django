from digisig.models import * 
from django.shortcuts import get_object_or_404

def sealsearch(ManifestationForm):
	manifestation_object = Manifestation.objects.all().order_by('id_manifestation')

	form = ManifestationForm(request.POST)

	if form.is_valid():

		qrepository = form.cleaned_data['repository']   
		qseries = form.cleaned_data['series']
		qrepresentation_type = form.cleaned_data['representation']
		qnature = form.cleaned_data['nature']
		qlocation = form.cleaned_data['location']
		qtimegroup = form.cleaned_data['timegroup']
		qshape = form.cleaned_data['shape']
		qshelfmark = form.cleaned_data['name']
		qclassname = form.cleaned_data['classname']
		qpagination = form.cleaned_data['pagination']
		qgroup = form.cleaned_data['group']

		rows = manifestation_object.count()

		if qrepository.isdigit():
			if int(qrepository) > 0:
				manifestation_object = manifestation_object.filter(
					fk_support__fk_part__fk_item__fk_repository=qrepository)

		if qseries.isdigit():
			if int(qseries) > 0:
				manifestation_object = manifestation_object.filter(
					fk_support__fk_part__fk_item__fk_series=qseries)

		if qrepresentation_type.isdigit():
			if int(qrepresentation_type) > 0:
				manifestation_object = manifestation_object.filter(
					fk_manifestation__fk_representation_type=qrepresentation_type)

		if qnature.isdigit():
			if int(qnature) > 0:
				manifestation_object = manifestation_object.filter(
					fk_support__fk_nature=qnature)

		if qlocation.isdigit():
			if int(qlocation) > 0:
				manifestation_object = manifestation_object.filter(
					fk_support__fk_part__fk_event__locationreference__fk_locationname__fk_location__fk_region=qlocation)

		if qtimegroup.isdigit():
			if int(qtimegroup) > 0:
				temporalperiod_target = (TimegroupA.objects.get(pk_timegroup_a = qtimegroup))   
				yearstart = (temporalperiod_target.timegroup_a_startdate)
				manifestation_object = manifestation_object.filter(
					fk_support__fk_part__fk_event__repository_startdate__lt=datetime.strptime(str(yearstart), "%Y")).filter(
					fk_support__fk_part__fk_event__repository_enddate__gt=datetime.strptime(str(yearstart+50), "%Y"))

		if qshape.isdigit():
			if int(qshape) > 0:
				manifestation_object = manifestation_object.filter(
					fk_face__fk_shape=qshape)

		if qgroup.isdigit():
			if int(qgroup) > 0:
				manifestation_object = manifestation_object.filter(
					fk_face__fk_seal__fk_printgroup=qgroup)

		if qclassname.isdigit():
			if int(qclassname) > 0:
				searchclassification =  Classification.objects.get(id_class = qclassname)
				manifestation_object = manifestation_object.filter(
					fk_face__fk_class__level1=searchclassification.level1)

				if searchclassification.level2 > 0:
					manifestation_object = manifestation_object.filter(
					fk_face__fk_class__level2=searchclassification.level2)

					if searchclassification.level3 > 0:
						manifestation_object = manifestation_object.filter(
						fk_face__fk_class__level3=searchclassification.level3)

						if searchclassification.level4 > 0:
							manifestation_object = manifestation_object.filter(
							fk_face__fk_class__level4=searchclassification.level4)

							if searchclassification.level5 > 0:
								manifestation_object = manifestation_object.filter(
								fk_face__fk_class__level5=searchclassification.level5)

								if searchclassification.level6 > 0:
									manifestation_object = manifestation_object.filter(
									fk_face__fk_class__level6=searchclassification.level6)

									if searchclassification.level7 > 0:
										manifestation_object = manifestation_object.filter(
										fk_face__fk_class__level7=searchclassification.level7)

		if len(qshelfmark) > 0:
			manifestation_object = manifestation_object.filter(
			fk_support__fk_part__fk_item__shelfmark__icontains=qshelfmark)


		form = ManifestationForm(request.POST)


	return(manifestation_object, form)