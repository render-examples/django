### ML tools ###
## https://stackoverflow.com/questions/15917116/split-django-models-and-modelforms-in-separate-file

import os
from django.conf import settings

#prediction function
import pickle
import numpy as np
import pandas as pd 


from sklearn.tree import DecisionTreeRegressor

# data
from sealquery.models import * 

# custom internal tools
from utils.generaltools import *


### Contents

##
# mldisplayresults 
# mlmodelget -- to get model

##Build the ML model
# mldatacase -- formats the sequence of fields for the machine learning process -- must conform to order used in training
# mlpredictcase -- load a pickled ML model and predict a SINGLE case
# mltrainmodel --
# mlpredictcase -- 
# mltrainset -- define the set of cases to use in training the ML model
# mlshowpath -- route for particular case

def sealml_timegroups_main():

	#Select all the nodes
	nodegroups = Seal.objects.order_by('date_prediction_node').distinct('date_prediction_node').values('date_prediction_node')

	nodedata= {}
	nodedatatext = "target|rangephrase|numcases|quantileset|resultset"

	for n in nodegroups:
		try:
			target = int(n['date_prediction_node'])
			resultset = {}

			# #find other seals assigned to this decision tree group
			timegroupcases = Seal.objects.filter(date_prediction_node=target).order_by("date_origin")
			timelist = []
			for t in timegroupcases:
				timelist.append(int(t.date_origin))

			quantileset = statistics.quantiles(timelist, n=6)
			resultrange = "c." + str(int(quantileset[0])) + "-" + str(int(quantileset[4]))

			resultset["quantiles"] = quantileset
			resultset["node"] = target
			resultset["rangephrase"] = resultrange
			resultset["numcases"] = len(timegroupcases)
			resultset["spanlength"] = (int(quantileset[4])) - (int(quantileset[0]))

			nodedata[target] = resultset

			nodedatatext = nodedatatext + "\n" + str(target) + "|" + str(resultrange) + "|" + str(len(timegroupcases)) + "|" + str(quantileset) + "|" +  str(resultset["spanlength"])

		except:
			pass
	
	urltimegroups = os.path.join(settings.STATIC_ROOT, 'ml\\ml_timegroups.txt')
	fileout = open(urltimegroups, 'w')
	fileout.write(nodedatatext)
	fileout.close()

	return (nodedata)

## this function seems to be unnecessary, or at least duplicate of what happens when you run the machine learning training process
def mlmodel_document(tree_clf, featurenames):

	import matplotlib as mpl
	import matplotlib.pyplot as plt

	from sklearn.tree import plot_tree
	t = plot_tree(tree_clf, feature_names=featurenames, node_ids=True, proportion=True)
	url3 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot')
	fileout = open(url3, 'w')
	fileout.write(str(t))
	fileout.close()

	#To plot pretty figures
	mpl.rc('axes', labelsize=14)
	mpl.rc('xtick', labelsize=12)
	mpl.rc('ytick', labelsize=12)

	plt.figure(figsize=(50,8), dpi=300)
	plot_tree(tree_clf, feature_names=featurenames, node_ids=True, proportion=True)
	plt.title("Decision Tree")
	url4 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot_diagram.jpg')
	url5 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot_diagram.jpg')
	plt.savefig(url4)
	plt.savefig(url5)

	return()


def mlmodelget():
	#url = os.path.join(settings.STATIC_ROOT, 'ml/2023_feb20_ml_tree')
	url = os.path.join(settings.STATIC_ROOT, 'ml/ml_tree')
	with open(url, 'rb') as file:	
		mlmodel = pickle.load(file)

	return(mlmodel)


def mldatacase(class_object, shape_object, resultarea):

	data = { 
		'Round': [shape_object.round],
		'pointedoval': [shape_object.pointedoval],
		'roundedoval': [shape_object.roundedoval],
		'scutiform': [shape_object.scutiform],
		'trianglepointingup': [shape_object.trianglepointingup],
		'unknown': [shape_object.unknown],
		'square': [shape_object.square],
		'lozenge': [shape_object.lozenge],
		'drop': [shape_object.drop],
		'trianglepointingdown': [shape_object.trianglepointingdown],
		'rectangular': [shape_object.rectangular],
		'hexagonal': [shape_object.hexagonal],
		'octagonal': [shape_object.octagonal],
		'abnormal': [shape_object.abnormal],
		'kite': [shape_object.kite],
		'quatrefoil': [shape_object.quatrefoil],
		'size_area': [resultarea],
		'animal': [class_object.animal],
		'human': [class_object.human],
		'objects': [class_object.object_class],
		'device': [class_object.device],
		'beast': [class_object.beast],
		'bird': [class_object.bird],
		'fish': [class_object.fish],
		'insect': [class_object.insect],
		'bust': [class_object.bust],
		'hand': [class_object.hand],
		'boat': [class_object.boat],
		'building': [class_object.building],
		'container': [class_object.container],
		'equipment': [class_object.equipment],
		'naturalproduct': [class_object.naturalproduct],
		'irregular': [class_object.irregular],
		'radial': [class_object.radial],
		'lattice': [class_object.lattice],
		'fulllength': [class_object.fulllength],
		'symbol': [class_object.symbol],
		'hawkhunting': [class_object.hawkhunting],
		'pelicaninpiety': [class_object.pelicaninpiety],
		'headondish': [class_object.headondish],
		'twoheads': [class_object.twoheads],
		'crossedhands': [class_object.crossedhands],
		'handholdingitem': [class_object.handholdingitem],
		'seated': [class_object.seated],
		'standing': [class_object.standing],
		'riding': [class_object.riding],
		'crucified': [class_object.crucified],
		'apparel': [class_object.apparel],
		'crenellation': [class_object.crenellation],
		'tool': [class_object.tool],
		'weapon': [class_object.weapon],
		'Shell': [class_object.shell],
		'wheatsheaf': [class_object.wheatsheaf],
		'stylizedlily': [class_object.stylizedlily],
		'crosses': [class_object.crosses],
		'heart': [class_object.heart],
		'merchantmark': [class_object.merchantmark],
		'texts': [class_object.texts],
		'handholdingbird': [class_object.handholdingbird],
		'halflength': [class_object.halflength],
		'crescent': [class_object.crescent],
		'beastbody': [class_object.beastbody],
		'beasthead': [class_object.beasthead],
		'doubleheadedeagle': [class_object.doubleheadedeagle],
		'horseshoe': [class_object.horseshoe],
		'twobirdsdrinking': [class_object.twobirdsdrinking],
		'animalequipment': [class_object.animalequipment],
		'transport': [class_object.transport],
		'halflengthwomanholdingchild': [class_object.halflengthwomanholdingchild],
		'halflengthwoman': [class_object.halflengthwoman],
		'halflengthman': [class_object.halflengthman],
		'swine': [class_object.swine],
		'boarhead': [class_object.boarhead],
		'centaur': [class_object.centaur],
		'dragon': [class_object.dragon],
		'hare': [class_object.hare],
		'lion': [class_object.lion],
		'lionhead': [class_object.lionhead],
		'mermaid': [class_object.mermaid],
		'squirrel': [class_object.squirrel],
		'stag': [class_object.stag],
		'staghead': [class_object.staghead],
		'unicorn': [class_object.unicorn],
		'unicornhead': [class_object.unicornhead],
		'wolf': [class_object.wolf],
		'wolfhead': [class_object.wolfhead],
		'standingwoman': [class_object.standingwoman],
		'standingman': [class_object.standingman],
		'armouredmanequestrian': [class_object.armouredmanequestrian],
		'seatedwomanholdingchild': [class_object.seatedwomanholdingchild],
		'axe': [class_object.axe],
		'shears': [class_object.shears],
		'arrow': [class_object.arrow],
		'spear': [class_object.spear],
		'sword': [class_object.sword],
		'banner': [class_object.banner],
		'shield': [class_object.shield],
		'christogram': [class_object.christogram],
		'lionfighting': [class_object.lionfighting],
		'sheep': [class_object.sheep],
		'griffin': [class_object.griffin],
		'hammer': [class_object.hammer],
		'standingwomanholdingchild': [class_object.standingwomanholdingchild],
		'hareonhound': [class_object.hareonhound],
		'lambandstaff': [class_object.lambandstaff],
		'lionsleeping': [class_object.lionsleeping],
		'standingliturgicalapparel': [class_object.standingliturgicalapparel],
		'manfightinganimal': [class_object.manfightinganimal],
		'bowandarrow': [class_object.bowandarrow],
		'spearandpennon': [class_object.spearandpennon],
		'seatedman': [class_object.seatedman],
		}

	return (data)


def mlpredictcase (class_object, shape_object, case_area, mlmodel):

	#df = mltest(class_object, shape_object, case_area)
	data = mldatacase(class_object, shape_object, case_area)
	df = pd.DataFrame(data)

	result = mlmodel.predict(df)
	leaf_id = mlmodel.apply(df)
	finalnode = (list(leaf_id))
	finalnodevalue = finalnode[0]
	result1 = result.item(0)
	resulttext = int(result.item(0))

	return (result, result1, resulttext, finalnodevalue, df)


def mlsealselect (timegroupcases, class_object, shape_object):
	# the function aims to assemble a set of 10 representations (images of seals) to show users
	# class_object -- the contents are described by --  class Classification(models.Model)  {see sealquery/models.py}
	# shape_object -- the contents are described by --  class Shape(models.Model)  {see sealquery/models.py}

	#timegroupcases are the seals that form part of the decision tree group (date group) of predicted seal
	caseset = timegroupcases.filter(face__fk_shape=shape_object).filter(face__fk_class=class_object)[:10].values("id_seal")

	subset = Manifestation.objects.filter(fk_face__fk_seal__in=caseset).filter(representation__fk_representation_type=1).filter(representation__primacy=1)

	if len(subset) < 10:
		print ("we need more cases")

	return (subset)		


def mlsealselectinfo (subset):
	representationset = []

	for s in subset:
		#assemble the data for links and metadata for images of examples:
		targetrepresentation = Representation.objects.filter(fk_manifestation__fk_face__fk_seal=s.id_seal).filter(fk_representation_type=1).filter(primacy=1)
		sealdescriptionset = Sealdescription.objects.filter(fk_seal=s.id_seal)
		descriptions = []

	#return (targetrepresentation, sealdescriptionset)

		for t in targetrepresentation:
			connection = t.fk_connection
			manifestation = t.fk_manifestation
			face = manifestation.fk_face 
			support = manifestation.fk_support 
			part = support.fk_part
			item = part.fk_item 
			repository = item.fk_repository 
			event = part.fk_event

			for sd in sealdescriptionset:
				descriptions.append ({sd.id_sealdescription: {"collection":str(sd.fk_collection), "identifier":sd.sealdescription_identifier}})

			# print (sd.fk_seal, descriptions)

			representationset.append({t.id_representation: 
				{"id_representation":t.id_representation, 
				"fk_digisig":t.fk_digisig,
				"connection_thumb":connection.thumb,
				"connection_medium":connection.medium,
				"representation_filename":t.representation_filename, 
				"representation_thumbnail":t.representation_thumbnail,
				"date_origin":str(s.date_origin),
				"fk_shape":str(face.fk_shape),
				"fk_class":str(face.fk_class),
				"repository_fulltitle":repository.repository_fulltitle,
				"shelfmark":item.shelfmark,
				"fk_item":item.id_item,
				"number":str(support.fk_number_currentposition),
				"label_manifestation_repository":manifestation.label_manifestation_repository,
				"repository_location": event.repository_location,
				"repository_startdate": event.repository_startdate,
				"repository_enddate": event.repository_enddate,
				"fk_seal": s.id_seal,
				"id_manifestation": manifestation.id_manifestation,
				"imagestate_term": str(manifestation.fk_imagestate),
				"descriptions": descriptions,
				}})

	return (representationset)		


def mlshowpath (mlmodel, df):
	node_indicator = mlmodel.decision_path(df)
	leaf_id = mlmodel.apply(df)
	feature = mlmodel.tree_.feature
	threshold = mlmodel.tree_.threshold
	n_nodes = mlmodel.tree_.node_count

	sample_id = 0
	# obtain ids of the nodes `sample_id` goes through, i.e., row `sample_id`
	node_index = node_indicator.indices[
	    node_indicator.indptr[sample_id] : node_indicator.indptr[sample_id + 1]
	]

	#print ("node_index", node_index)

	# feature names
	i = -1
	featurenames = []
	for col in df.columns:
	    i = i + 1
	    #print (i, col)

	    if col == "size_area":
	    	col = "size"
	    featurenames.append(col)

	decisiontreetext= []
	decisiontreedic= {}
	for node_id in node_index:
	    
	    # continue to the next node if it is a leaf node
	    if leaf_id[sample_id] == node_id:
	        continue 

	    value = df.iat[0,feature[node_id]]
	    
	    if value <= threshold[node_id]:
	        threshold_sign = "<="
	    else:
	        threshold_sign = ">"

	    decisiontreetext.append(
	        "decision node {node} : {featurename}({value}) "
	        "{inequality} {threshold}".format(
	            node=node_id,
	            sample=sample_id,
	            feature=feature[node_id],
	            featurename=featurenames[feature[node_id]],
	            value = df.iat[0,feature[node_id]],
	            #value=X2[sample_id, feature[node_id]],
	            inequality=threshold_sign,
	            threshold=threshold[node_id],
	        )
	    )

	    decisiontreedic[node_id] = {
	    	"node": node_id,
	    	"inequality": threshold_sign,
	    	"feature": feature[node_id],
	    	"featurename": featurenames[feature[node_id]],
	    	"value": df.iat[0,feature[node_id]],
	    	"inequality":threshold_sign,
	    	"threshold": round(threshold[node_id], 2)
	    }

	return (node_index, decisiontreedic)



def mltrainmodel():
	## function handles the creation of the ML model

	# to make this output stable
	np.random.seed(42)	

	datain, trainingset = mlloaddata()

	dataset = pd.DataFrame(datain)
	shapeofdataset =dataset.shape
	print ("shapeofdataset", shapeofdataset)

	X = dataset.iloc[:,0:111]
	y = dataset.iloc[:,111:112]

	tree_clf = DecisionTreeRegressor(max_depth=7, min_samples_leaf=20, criterion="squared_error", random_state=42)
	tree_out= tree_clf.fit(X, y)

	## code for creating a human readable decision tree graph
	i = -1
	featurenames = []

	for col in X.columns:
		i = i + 1
		featurenames.append(col)

	from sklearn.tree import export_text
	r = export_text(tree_out, feature_names=featurenames)

	url2 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_text.txt')
	fileout = open(url2, 'w')
	fileout.write(r)
	fileout.close()

	url = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree')
	with open(url, 'wb') as file:
		pickle.dump(tree_clf, file)

	from sklearn.tree import plot_tree
	t = plot_tree(tree_clf, feature_names=featurenames, node_ids=True, proportion=True)
	url3 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot')
	fileout = open(url3, 'w')
	fileout.write(str(t))
	fileout.close()

	mlmodel_document(tree_clf, featurenames)

	# import matplotlib as mpl
	# import matplotlib.pyplot as plt
	#To plot pretty figures
	# mpl.rc('axes', labelsize=14)
	# mpl.rc('xtick', labelsize=12)
	# mpl.rc('ytick', labelsize=12)

	# plt.figure(figsize=(50,8), dpi=300)
	# plot_tree(tree_clf, feature_names=featurenames, node_ids=True, proportion=True)
	# plt.title("Decision Tree")
	# url4 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot_diagram.jpg')
	# url5 = os.path.join(settings.STATIC_ROOT, 'ml\\ml_tree_plot_diagram.jpg')
	# plt.savefig(url4)
	# plt.savefig(url5)

	#### apply ML model to predict all the cases used in training
	### this might be an alterative method 
		## -- https://stackoverflow.com/questions/63794821/get-all-values-of-a-terminal-leaf-node-in-a-decisiontreeregressor

	print("predictcasesusedintraining")
	for case in trainingset:
		shape_value1 = case.fk_shape
		shape_value = shape_value1.pk_shape
		vertvalue = case.face_vertical
		horizontalvalue = case.face_horizontal
		resultarea = faceupdater(shape_value, vertvalue, horizontalvalue)

		result, result1, resulttext, finalnodevalue, df = mlpredictcase(case.fk_class, case.fk_shape, resultarea, tree_out)

		result_date = result.item(0)

		sealcase = case.fk_seal

		sealcase.date_prediction = result_date
		sealcase.date_prediction_node = finalnodevalue
		sealcase.save()

		#print (sealcase, result_date, finalnodevalue)

	return ()


def mlloaddata():

	trainingset = mltrainset()
	dataset = {}

	i = 0
	for case in trainingset:
		class_object = case.fk_class
		shape_object = case.fk_shape
		resultarea = faceupdater(shape_object.pk_shape, case.face_vertical, case.face_horizontal) 
		seal_object = case.fk_seal

		datacase = mldatacase(class_object, shape_object, resultarea)

		## for a test case you don't need the date -- must add if date to be used in training
		datacase["date_origin"] = [seal_object.date_origin]

		## case is a dictionary that contains lists. Merge all those lists together
		for datalabel, datapoint in datacase.items():

			if datalabel in dataset:
				currentlist = dataset[datalabel]
				currentlist.append(datapoint[0])
				dataset.update({datalabel:currentlist})
			else:
				dataset[datalabel]=datapoint
							
	return (dataset, trainingset)


def mltrainset():

	face_objectset = Face.objects.exclude(
		face_vertical__isnull=True).exclude(
		face_horizontal__isnull=True).filter(
		face_vertical__gt=0).filter(
		face_horizontal__gt=0).filter(
		fk_faceterm=1).filter(
		fk_shape__shape_consider=1).filter(
		fk_seal__fk_printgroup__exclude=0).filter(
		fk_seal__date_origin__lt=1500).filter(
		fk_seal__date_origin__gt=1099).exclude(
		fk_class=10001007).exclude(
		fk_class=10000367).exclude(
		fk_seal__sealdescription__fk_collection=30000167).exclude(
		fk_seal__sealdescription__fk_collection=30000267).exclude(
		fk_seal__sealdescription__fk_collection=30000087).exclude(
		fk_seal__sealdescription__fk_collection=30000047).filter(
		fk_seal__date_precision__lte=4).exclude(
		fk_shape=11).exclude(
		fk_shape=5).filter(
		# manifestation__fk_support__fk_part__fk_event__locationreference__fk_locationstatus=1).filter(
		manifestation__fk_support__fk_part__fk_event__locationreference__fk_locationname__fk_location__fk_region__fk_regiongrouping=1).order_by('fk_seal').distinct('fk_seal')

	print ("training dataset length", len(face_objectset))

	url = os.path.join(settings.STATIC_ROOT, 'ml\\ml_faceobjectset')
	with open(url, 'wb') as file:
		pickle.dump(face_objectset, file)

	return(face_objectset)
