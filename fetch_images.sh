#!/bin/bash
rm imglist.txt
grep -oE "https://lh[0-9].googleusercontent.com/[A-Za-z0-9_-]+" "./html/Photo.html" > imglist.txt
wget -i imglist.txt -P ./images
#cd ./images
#mogrify -format jpg *.png
