#!/bin/sh

# Save the current directory
original_dir=$(pwd)

# Build the Rauygun4Node package
echo "Building raygun package..."
cd ../..
npm install > /dev/null
cd "$original_dir" || exit
echo "...done!"
echo

# Build the AWS Lambda package
echo "Building @raygun.io/aws-lambda package..."
cd ../../aws-lambda || exit
npm install > /dev/null
cd "$original_dir" || exit
echo "...done!"
echo

echo "Delete old zip file..."
rm -f example.zip
echo "...done!"
echo

# Build app with option "install-links" so no symbolic-links are created
echo "Building example..."
npm install --install-links > /dev/null
echo "...done!"
echo

# Zip all the contents of the folder (excluding this script)
echo "Zipping all the contents of the folder..."
zip -r example.zip . -x "prepare.sh" > /dev/null
echo "..done!"
