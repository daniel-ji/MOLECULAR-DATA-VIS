#!/bin/bash

# Check if file is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <csv file>"
    exit 1
fi

# Check if file exists
if [ ! -f $1 ]; then
    echo "File $1 does not exist."
    exit 1
fi

# Replace third column
awk -F',' -v OFS=',' '{$3="MSM"; print}' $1 > temp.csv && mv temp.csv $1
