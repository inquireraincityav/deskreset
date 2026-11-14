#!/bin/bash
# Double-click this file in Finder to clear the macOS quarantine
# attribute from Desk Reset, so you can open it without a "damaged"
# warning. Only needed once per computer, per install.
set -e
APP="/Applications/Desk Reset.app"
if [ ! -d "$APP" ]; then
  echo "Desk Reset is not in /Applications yet."
  echo "Drag Desk Reset to Applications first, then run this again."
  read -n 1 -s -r -p "Press any key to close."
  exit 1
fi
xattr -cr "$APP"
echo ""
echo "Done. Desk Reset will open normally now."
echo "You can close this window."
read -n 1 -s -r -p "Press any key to close."
