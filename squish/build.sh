#! /usr/bin/bash

emcc -o out.js ./*.cpp -s EXPORTED_FUNCTIONS="['_GetStorageRequirements','_CompressImage','DecompressImage']"

