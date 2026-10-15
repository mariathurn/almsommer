# Turns the app's internal font names inside style="" into plain SVG font attributes Figma understands.
my %f = (AlfaSlabOne_400Regular => ["Alfa Slab One", 400], BarlowCondensed_700Bold => ["Barlow Condensed", 700],
  AlegreyaSans_400Regular => ["Alegreya Sans", 400], AlegreyaSans_500Medium => ["Alegreya Sans", 500],
  AlegreyaSans_700Bold => ["Alegreya Sans", 700], AlegreyaSans_800ExtraBold => ["Alegreya Sans", 800],
  CaveatBrush_400Regular => ["Caveat Brush", 400]);
s{style="font-family: (\w+); font-size: ([\d.]+)px;"}{ $f{$1} ? qq(font-family="$f{$1}[0]" font-weight="$f{$1}[1]" font-size="$2") : $& }ge;
