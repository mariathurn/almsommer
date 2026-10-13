/* Watercolour mountain meadow behind every screen: pale sky, layered alpine
ridges and meadow hills, a small hut, and the paper texture laid over it all
so the flat shapes read as painted washes. */

import { StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Image, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { cardTexture } from "../data/cardDesign";
import { colors } from "../theme";

const flowers = [
    [70, 540, colors.alpenrose], [130, 565, colors.hay], [210, 530, colors.paper],
    [330, 575, colors.alpenrose], [460, 548, colors.enzian], [560, 585, colors.hay],
    [690, 540, colors.paper], [770, 570, colors.alpenrose], [880, 535, colors.hay],
    [950, 580, colors.enzian],
];

function MeadowBackground() {
    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
                <Defs>
                    <LinearGradient id="meadow-sky" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#d3e3e8" />
                        <Stop offset="0.55" stopColor="#f3ecdb" />
                    </LinearGradient>
                    <RadialGradient id="meadow-sun" cx="0.78" cy="0.2" r="0.35">
                        <Stop offset="0" stopColor={colors.hayLight} stopOpacity="0.85" />
                        <Stop offset="1" stopColor={colors.hayLight} stopOpacity="0" />
                    </RadialGradient>
                </Defs>

                <Rect width="1000" height="600" fill="url(#meadow-sky)" />
                <Rect width="1000" height="600" fill="url(#meadow-sun)" />

                {/* Far peaks with a little snow */}
                <Path
                    d="M0 300 L90 220 L160 262 L260 150 L360 240 L450 190 L540 252 L640 130 L760 232 L850 182 L1000 262 L1000 600 L0 600 Z"
                    fill={colors.enzian}
                    opacity={0.28}
                />
                <Path d="M238 172 L260 150 L284 174 L270 168 L260 178 L249 167 Z" fill={colors.paper} opacity={0.9} />
                <Path d="M618 154 L640 130 L664 156 L650 150 L640 160 L630 149 Z" fill={colors.paper} opacity={0.9} />

                {/* Nearer ridge */}
                <Path
                    d="M0 360 C120 300 220 332 320 302 C430 272 520 332 640 302 C760 272 880 322 1000 292 L1000 600 L0 600 Z"
                    fill="#8fa9a0"
                    opacity={0.45}
                />

                {/* Meadow hills */}
                <Path
                    d="M0 420 C160 360 320 402 480 382 C640 362 820 402 1000 372 L1000 600 L0 600 Z"
                    fill="#b8cc95"
                />
                <Path d="M772 382 L772 360 L790 346 L808 360 L808 382 Z" fill="#8a6a4a" opacity={0.85} />
                <Path d="M766 362 L790 340 L814 362 Z" fill="#6b4f37" opacity={0.9} />
                <Path
                    d="M0 500 C200 450 420 492 600 472 C780 452 900 482 1000 472 L1000 600 L0 600 Z"
                    fill={colors.meadow}
                />

                {flowers.map(([x, y, fill], index) => (
                    <Circle key={index} cx={x} cy={y} r={4} fill={fill} opacity={0.8} />
                ))}

                {/* Paper grain: turns the flat shapes into washes */}
                <Image
                    href={cardTexture}
                    width="1000"
                    height="600"
                    preserveAspectRatio="xMidYMid slice"
                    opacity={0.35}
                />
            </Svg>
        </View>
    );
}

export default MeadowBackground;
