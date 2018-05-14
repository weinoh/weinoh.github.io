#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Feb 16 18:10:07 2018

@author: aweintraut
"""
import pandas as pd
import numpy as np
from sklearn import preprocessing

# PROCESS SQF
data = pd.read_csv('NYPD_Complaint_Data_Historic.csv')
df = pd.DataFrame(data, columns=['CMPLNT_NUM','CMPLNT_FR_DT','CMPLNT_FR_TM',
                                 'CMPLNT_TO_DT','CMPLNT_TO_TM','RPT_DT','KY_CD',
                                 'OFNS_DESC','PD_CD','PD_DESC','CRM_ATPT_CPTD_CD',
                                 'LAW_CAT_CD','JURIS_DESC','BORO_NM','ADDR_PCT_CD',
                                 'LOC_OF_OCCUR_DESC','PREM_TYP_DESC','PARKS_NM',
                                 'HADEVELOPT','X_COORD_CD','Y_COORD_CD',
                                 'Latitude','Longitude','Lat_Lon']
            )




df = df.drop_duplicates()
df = df.drop(columns=['CMPLNT_NUM','CMPLNT_TO_DT','CMPLNT_FR_DT', 'CMPLNT_TO_TM',
              'PD_CD', 'PD_DESC', 'CRM_ATPT_CPTD_CD',
              'JURIS_DESC','LOC_OF_OCCUR_DESC','PREM_TYP_DESC',
              'X_COORD_CD','Y_COORD_CD','Lat_Lon','PARKS_NM','HADEVELOPT','ADDR_PCT_CD'])

#df['CMPLNT_FR_DT'] = df['CMPLNT_FR_DT'].str.replace('/','-')
#df['CMPLNT_TO_DT'] = df['CMPLNT_TO_DT'].str.replace('/','-')
df['RPT_DT'] = df['RPT_DT'].str.replace('/','-')


#df['CMPLNT_TO_DT'] = pd.to_datetime(df['CMPLNT_TO_DT'], format='%m-%d-%Y', errors='ignore')
df['RPT_DT'] = pd.to_datetime(df['RPT_DT'], format='%m-%d-%Y', errors='ignore')
#df['CMPLNT_FR_DT'] = pd.to_datetime(df['CMPLNT_FR_DT'], format='%m-%d-%Y', errors='ignore')

# df['CMPLNT_FR_DT'] = df['CMPLNT_FR_DT'].dt.strftime("%Y-%m-%d")
# df['CMPLNT_TO_DT'] = df['CMPLNT_TO_DT'].dt.strftime("%Y-%m-%d")
#df['RPT_DT'] = df['RPT_DT'].dt.strftime("%Y-%m-%d")

#FILTER TO ONLY 2015
df = df[(df['RPT_DT'] >= '2015-01-01') & (df['RPT_DT'] <= '2015-12-31')]

df = df.sort_values(['RPT_DT'], ascending=True)

#Save to new location
df.to_csv('../csv/ny_crime.csv')
print("DONE WITH SAVING TO CSV")

#
# #NORMALIZATION
# x = df_valid.values #returns a numpy array
# min_max_scaler = preprocessing.MinMaxScaler()
# x_scaled = min_max_scaler.fit_transform(x)
# df_normalized = pd.DataFrame(x_scaled, columns=['indicator_data_id','indicator_id',
#                                  'name','Measure','geo_type_name',
#                                  'geo_entity_id','geo_entity_name',
#                                  'year_description','data_valuemessage'])



# #Create array with column names
# colNames_LR = list(df_linreg)
# colNames_ANN = list(df_ann)
#
# #Big matrices
# LR_matrix = df_linreg.values
# ANN_matrix = df_ann.values
#
# #removed values
# albumin = df_albumin.values
# da_vals = df_da.values
