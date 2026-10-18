/* A trophy cup for the achievements: gold with a star and a shine when
earned, a pale outline when still locked. Drawn in a 64 x 64 box. */

import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "../theme";

const BOWL = "M14 8 H50 V16 C50 30 42 39 32 40 C22 39 14 30 14 16 Z";
const HANDLES = "M14 13 C4 13 4 29 18 30 M50 13 C60 13 60 29 46 30";
const STAR = "M32 14 L34.6 19.6 L40.6 20.2 L36 24.2 L37.4 30 L32 27 L26.6 30 L28 24.2 L23.4 20.2 L29.4 19.6 Z";
const BASE = "M20 56 L22.5 49 H41.5 L44 56 Z";

function Trophy({ size = 56, unlocked = true }) {
    const line = unlocked ? colors.ink : colors.keyline;
    const fill = unlocked ? colors.hay : colors.paper;
    const stroke = { stroke: line, strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };

    return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
            <Path d={HANDLES} fill="none" {...stroke} />
            <Rect x={28.5} y={39} width={7} height={11} fill={unlocked ? colors.hayDeep : fill} {...stroke} />
            <Path d={BASE} fill={fill} {...stroke} />
            <Path d={BOWL} fill={fill} {...stroke} strokeDasharray={unlocked ? undefined : "4 4"} />
            {unlocked ? (
                <>
                    {/* Shine on the left of the bowl, and the star. */}
                    <Path d="M19.5 14 C19.5 24 22 30 26 34" fill="none" stroke={colors.hayLight} strokeWidth={3} strokeLinecap="round" />
                    <Path d={STAR} fill={colors.ink} />
                </>
            ) : null}
        </Svg>
    );
}

export default Trophy;
