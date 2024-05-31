#!/bin/sh

echo "Delete old zip file..."
rm -f example.zip

# Build app with option "install-links" so no symbolic-links are created
echo "Building the node app..."
npm install --install-links

# Zip all the contents of the folder (excluding this script)
echo "Zipping all the contents of the folder..."
zip -r example.zip . -x "prepare.sh" > /dev/null

echo "Done!"
