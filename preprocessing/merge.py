import math
import csv
import json
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from statsmodels.tsa.arima.model import ARIMA
from scipy.stats import pearsonr, spearmanr

COUNTRY_GEOJSON_PATH = './countries.geojson'
COUNTRY_PATH = './country.csv'
LIFE_EXP_FEMALE_PATH = './lifeExpFemale.csv'
LIFE_EXP_MALE_PATH = './lifeExpMale.csv'
LIFE_EXP_ALL_PATH = './lifeExpAll.csv'
IMMUNIZATION_DPT_PATH = './immunizationDpt.csv'
GDP_PATH = './gdp.csv'
GDP_CAPITA_PATH = './gdpCapita.csv'

dataArray = []
resArray = []

with open(LIFE_EXP_FEMALE_PATH, 'r') as csvLifeExpFemale:
    with open(LIFE_EXP_MALE_PATH, 'r') as csvLifeExpMale:
        with open(LIFE_EXP_ALL_PATH, 'r') as csvLifeExpAll:
            with open(IMMUNIZATION_DPT_PATH, 'r') as csvImmunizationDpt:
                with open(GDP_PATH, 'r') as csvGdp:
                    with open(GDP_CAPITA_PATH, 'r') as csvGdpCapita:

                        lifeExpFemaleReader = csv.reader(csvLifeExpFemale, delimiter=',', quotechar='"')
                        lifeExpMaleReader = csv.reader(csvLifeExpMale, delimiter=',', quotechar='"')
                        lifeExpAllReader = csv.reader(csvLifeExpAll, delimiter=',', quotechar='"')
                        immunizationDptReader = csv.reader(csvImmunizationDpt, delimiter=',', quotechar='"')
                        gdpReader = csv.reader(csvGdp, delimiter=',', quotechar='"')
                        gdpCapitaReader = csv.reader(csvGdpCapita, delimiter=',', quotechar='"')

                        for rowLifeExpFemale, rowLifeExpMale, rowLifeExpAll, rowImmuDpt, rowGdp, rowGdpCapita in zip(lifeExpFemaleReader, lifeExpMaleReader, lifeExpAllReader, immunizationDptReader, gdpReader, gdpCapitaReader):

                            dataArray.append({
                                'country': rowLifeExpFemale[0],
                                'countryCode': rowLifeExpFemale[1],
                                'lifeExpFemale': np.around(np.array(rowLifeExpFemale[4:-1]).astype(float), 2).tolist(),
                                'lifeExpMale': np.around(np.array(rowLifeExpMale[4:-1] + [rowLifeExpMale[-2]]).astype(float), 2).tolist(),
                                'lifeExpAll': np.around(np.array(rowLifeExpAll[4:-1] + [rowLifeExpAll[-2]]).astype(float), 2).tolist(),
                                'immunDpt': np.around(np.array(rowImmuDpt[4:-1]).astype(float), 2).tolist(),
                                'gdp': np.around(np.array(rowGdp[4:-1]).astype(float), 0).astype(int).tolist(),
                                'gdpPerCapita': np.around(np.array(rowGdpCapita[4:-1]).astype(float), 0).astype(int).tolist(),
                            })


regionArray = {}
coordsArray = {}
with open(COUNTRY_PATH, 'r') as csvCountry:
    countryReader = csv.reader(csvCountry, delimiter=',', quotechar='"')
    for rowCountry in countryReader:
        regionArray[rowCountry[2]] = rowCountry[3]
        coordsArray[rowCountry[2]] = (rowCountry[4], rowCountry[5])


geoArray = []
with open(COUNTRY_GEOJSON_PATH, 'r') as file:
    obj = json.load(file)

    for c in obj['features']:
        for x in dataArray:
            if (x['countryCode'] == c['properties']['ISO_A3'] and x['countryCode'] in regionArray.keys()):

                lifeExpSimDic = {}
                immunSimDic = {}
                gdpSimDic = {}
                for y in dataArray:
                    if (y['countryCode'] in regionArray.keys()):
                        # do forecasting and similarity here
                        lifeExpSimDic[y['countryCode']] = cosine_similarity(np.array([x['lifeExpAll']]), np.array([y['lifeExpAll']]))[0][0]
                        immunSimDic[y['countryCode']] = cosine_similarity(np.array([x['immunDpt']]), np.array([y['immunDpt']]))[0][0]
                        gdpSimDic[y['countryCode']] = cosine_similarity(np.array([x['gdp']]), np.array([y['gdp']]))[0][0]
                
                # lifeExpPred
                diffArray = np.sqrt(np.abs(np.diff(np.array(x['lifeExpAll']))))
                forecasterModel = ARIMA(diffArray, order=(6,1,0))
                forecasterModelFit = forecasterModel.fit()
                prediction = forecasterModelFit.predict(start=len(diffArray), end=len(diffArray)+9) # prediction for next 10 years
                lifeExpOld = np.array(x['lifeExpAll'])
                lifeExpOld = lifeExpOld[lifeExpOld >= 0]
                if len(lifeExpOld) != 0:
                    lifeExpPred = np.around(lifeExpOld[-1] + np.sum(prediction), 2)
                else:
                    lifeExpPred = -1

                # lifeExpPred Female
                diffArray = np.sqrt(np.abs(np.diff(np.array(x['lifeExpFemale']))))
                forecasterModel = ARIMA(diffArray, order=(6,1,0))
                forecasterModelFit = forecasterModel.fit()
                prediction = forecasterModelFit.predict(start=len(diffArray), end=len(diffArray)+9) # prediction for next 10 years
                lifeExpOld = np.array(x['lifeExpFemale'])
                lifeExpOld = lifeExpOld[lifeExpOld >= 0]
                if len(lifeExpOld) != 0:
                    lifeExpFemalePred = np.around(lifeExpOld[-1] + np.sum(prediction), 2)
                else:
                    lifeExpFemalePred = -1

                # lifeExpPred Male
                diffArray = np.sqrt(np.abs(np.diff(np.array(x['lifeExpMale']))))
                forecasterModel = ARIMA(diffArray, order=(6,1,0))
                forecasterModelFit = forecasterModel.fit()
                prediction = forecasterModelFit.predict(start=len(diffArray), end=len(diffArray)+9) # prediction for next 10 years
                lifeExpOld = np.array(x['lifeExpMale'])
                lifeExpOld = lifeExpOld[lifeExpOld >= 0]
                if len(lifeExpOld) != 0:
                    lifeExpMalePred = np.around(lifeExpOld[-1] + np.sum(prediction), 2)
                else:
                    lifeExpMalePred = -1

                # gdpPred
                diffArray = np.sqrt(np.abs(np.diff(np.array(x['gdpPerCapita']))))
                forecasterModel = ARIMA(diffArray, order=(6,1,0))
                forecasterModelFit = forecasterModel.fit()
                prediction = forecasterModelFit.predict(start=len(diffArray), end=len(diffArray)+9) # prediction for next 10 years
                gdpOld = np.array(x['gdpPerCapita'])
                gdpOld = gdpOld[gdpOld >= 0]

                if len(gdpOld) != 0:
                    gdpPred = np.around(gdpOld[-1] + np.sum(prediction), 2)
                else:
                    gdpPred = -1

                #lifeExpAllGdpCorrelation
                lifeExpGdpCorrS, ps = spearmanr(x['lifeExpAll'], x['gdpPerCapita'])
                if math.isnan(lifeExpGdpCorrS):
                    lifeExpGdpCorrS = -1

                lifeExpGdpCorrP, ps = pearsonr(x['lifeExpAll'], x['gdpPerCapita'])
                if math.isnan(lifeExpGdpCorrP):
                    lifeExpGdpCorrP = -1

                lifeExpImmunCorrS, ps = spearmanr(x['lifeExpAll'], x['immunDpt'])
                if math.isnan(lifeExpImmunCorrS):
                    lifeExpImmunCorrS = -1

                lifeExpImmunCorrP, ps = pearsonr(x['lifeExpAll'], x['immunDpt'])
                if math.isnan(lifeExpImmunCorrP):
                    lifeExpImmunCorrP = -1

                newProperties = {
                    'ADMIN': c['properties']['ADMIN'],
                    'ISO_A3': c['properties']['ISO_A3'],
                    'region': regionArray[x['countryCode']] if (x['countryCode'] in regionArray.keys()) else 'International',
                    'lat': float(coordsArray[x['countryCode']][0]),
                    'lon': float(coordsArray[x['countryCode']][1]),
                    'lifeExpFemale': x['lifeExpFemale'],
                    'lifeExpMale': x['lifeExpMale'],
                    'lifeExpAll': x['lifeExpAll'],
                    'immunDpt': x['immunDpt'],
                    'gdp': x['gdp'],
                    'gdpPerCapita': x['gdpPerCapita'],
                    'lifeExpSim': lifeExpSimDic,
                    'lifeExpPred': lifeExpPred,
                    'lifeExpFemalePred': lifeExpFemalePred,
                    'lifeExpMalePred': lifeExpMalePred,
                    'immunDptSim': immunSimDic,
                    # 'immunDptPred': immunDptPred,
                    'gdpSim': gdpSimDic,
                    'gdpPred': gdpPred,
                    'lifeExpGdpCorrS': lifeExpGdpCorrS,
                    'lifeExpGdpCorrP': lifeExpGdpCorrP,
                    'lifeExpImmunCorrS': lifeExpImmunCorrS,
                    'lifeExpImmunCorrP': lifeExpImmunCorrP
                }
                
                c['properties'] = newProperties

                geoArray.append(c)

lifeExpFemaleStats = []
lifeExpMaleStats = []
lifeExpAllStats = []
immunDptStats = []
gdpStats = []
gdpPerCapitaStats = []

for i in range(0, len(geoArray[0]['properties']['lifeExpFemale'])):
    
    tmpExpFemale = []
    tmpExpMale = []
    tmpExpAll = []
    tmpImmunDpt = []
    tmpGdp = []
    tmpGdpPCapita = []
    for x in geoArray:
        tmpExpFemale.append(x['properties']['lifeExpFemale'][i])
        tmpExpMale.append(x['properties']['lifeExpMale'][i])
        tmpExpAll.append(x['properties']['lifeExpAll'][i])
        tmpImmunDpt.append(x['properties']['immunDpt'][i])
        tmpGdp.append(x['properties']['gdp'][i])
        tmpGdpPCapita.append(x['properties']['gdpPerCapita'][i])

    lifeExpFemaleStats.append({
        'min': min(val for val in tmpExpFemale if val > 0),
        'max': max(tmpExpFemale)
    })

    lifeExpMaleStats.append({
        'min': min(val for val in tmpExpMale if val > 0),
        'max': max(tmpExpMale)
    })

    lifeExpAllStats.append({
        'min': min(val for val in tmpExpAll if val > 0),
        'max': max(tmpExpAll)
    })

    immunDptStats.append({
        'min': min((val for val in tmpImmunDpt if val > 0)) if len(list(val for val in tmpImmunDpt if val > 0)) > 0 else -1,
        'max': max(tmpImmunDpt)
    })

    gdpStats.append({
        'min': min(val for val in tmpGdp if val > 0),
        'max': max(tmpGdp)
    })

    gdpPerCapitaStats.append({
        'min': min(val for val in tmpGdpPCapita if val > 0),
        'max': max(tmpGdpPCapita)
    })

resObject = {
    'globalStats': {
        'lifeExpFemale': {
            'yearly': lifeExpFemaleStats,
            'min': min(val for val in map(lambda x: x['min'], lifeExpFemaleStats) if val > 0),
            'max': max(map(lambda x: x['max'], lifeExpFemaleStats))
        },
        'lifeExpMale': {
            'yearly': lifeExpMaleStats,
            'min': min(val for val in map(lambda x: x['min'], lifeExpMaleStats) if val > 0),
            'max': max(map(lambda x: x['max'], lifeExpMaleStats))
        },
        'lifeExpAll': {
            'yearly': lifeExpAllStats,
            'min': min(val for val in map(lambda x: x['min'], lifeExpAllStats) if val > 0),
            'max': max(map(lambda x: x['max'], lifeExpAllStats))
        },
        'immunDpt': {
            'yearly': immunDptStats,
            'min': min(val for val in map(lambda x: x['min'], immunDptStats) if val > 0),
            'max': max(map(lambda x: x['max'], immunDptStats))
        },
        'gdp': {
            'yearly': gdpStats,
            'min': min(val for val in map(lambda x: x['min'], gdpStats) if val > 0),
            'max': max(map(lambda x: x['max'], gdpStats))
        },
        'gdpPerCapita': {
            'yearly': gdpPerCapitaStats,
            'min': min(val for val in map(lambda x: x['min'], gdpPerCapitaStats) if val > 0),
            'max': max(map(lambda x: x['max'], gdpPerCapitaStats))
        }
    },
    'geojson': {
        'type': 'FeatureCollection',
        'features': geoArray
    }
}

# print (geoArray[17]['properties'])

json_output = json.dumps(resObject, indent = 4)
  
# Writing to sample.json
with open("./countryData.geojson", "w") as outfile:
    outfile.write(json_output)