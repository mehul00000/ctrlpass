import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Rect,
} from 'react-native-svg';
import {
  StyleProp,
  ViewStyle,
} from 'react-native';

export interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

type SvgElement = React.ReactElement<Record<string, unknown>>;

function createIcon(
  elements: SvgElement[],
) {
  return function Icon({
    color = '#F5F5F2',
    size = 20,
    strokeWidth = 1.8,
    style,
  }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={style}
      >
        {elements.map((element, index) =>
          React.cloneElement(element, {
            key: index,
            stroke: color,
            strokeWidth,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }),
        )}
      </Svg>
    );
  };
}

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */

export const HomeIcon = createIcon([
  <Path d="M3.5 10.5 12 3.5l8.5 7" />,
  <Path d="M5.5 9.5V20.5h13V9.5" />,
  <Path d="M9.5 20.5v-5.5h5v5.5" />,
]);

export const CompassIcon = createIcon([
  <Circle cx="12" cy="12" r="9" />,
  <Path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />,
]);

export const TicketIcon = createIcon([
  <Path d="M4.5 5h15A1.5 1.5 0 0 1 21 6.5V9a3 3 0 0 0 0 6v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5V15a3 3 0 0 0 0-6V6.5A1.5 1.5 0 0 1 4.5 5Z" />,
  <Line x1="14" y1="5.5" x2="14" y2="8" />,
  <Line x1="14" y1="11" x2="14" y2="13" />,
  <Line x1="14" y1="16" x2="14" y2="18.5" />,
]);

export const UserIcon = createIcon([
  <Circle cx="12" cy="8" r="3.75" />,
  <Path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />,
]);

export const ReceiptIcon = createIcon([
  <Path d="M5.5 3.5h13V20l-2.2-1.4-2.1 1.4-2.2-1.4L9.8 20l-2.1-1.4L5.5 20V3.5Z" />,
  <Line x1="9" y1="8" x2="15" y2="8" />,
  <Line x1="9" y1="11.5" x2="15" y2="11.5" />,
  <Line x1="9" y1="15" x2="12.5" y2="15" />,
]);

/* -------------------------------------------------------------------------- */
/* Search / filters                                                            */
/* -------------------------------------------------------------------------- */

export const SearchIcon = createIcon([
  <Circle cx="10.8" cy="10.8" r="6.8" />,
  <Path d="m16 16 4.2 4.2" />,
]);

export const SlidersIcon = createIcon([
  <Line x1="4" y1="7" x2="20" y2="7" />,
  <Line x1="4" y1="12" x2="20" y2="12" />,
  <Line x1="4" y1="17" x2="20" y2="17" />,
  <Circle cx="9" cy="7" r="2" />,
  <Circle cx="15" cy="12" r="2" />,
  <Circle cx="7" cy="17" r="2" />,
]);

/* -------------------------------------------------------------------------- */
/* Navigation controls                                                         */
/* -------------------------------------------------------------------------- */

export const ChevronLeftIcon = createIcon([
  <Path d="m14.5 5.5-6.5 6.5 6.5 6.5" />,
]);

export const ChevronRightIcon = createIcon([
  <Path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
]);

export const ChevronDownIcon = createIcon([
  <Path d="m6.5 9 5.5 5.5L17.5 9" />,
]);

export const ChevronUpIcon = createIcon([
  <Path d="m6.5 15 5.5-5.5 5.5 5.5" />,
]);

export const CloseIcon = createIcon([
  <Path d="m6 6 12 12" />,
  <Path d="m18 6-12 12" />,
]);

export const PlusIcon = createIcon([
  <Line x1="12" y1="5" x2="12" y2="19" />,
  <Line x1="5" y1="12" x2="19" y2="12" />,
]);

export const MinusIcon = createIcon([
  <Line x1="5" y1="12" x2="19" y2="12" />,
]);

/* -------------------------------------------------------------------------- */
/* Actions                                                                     */
/* -------------------------------------------------------------------------- */

export const ShareIcon = createIcon([
  <Path d="M7 17 17 7" />,
  <Path d="M9 7h8v8" />,
]);

export const EditIcon = createIcon([
  <Path d="M4 20h4L19 9l-4-4L4 16v4Z" />,
  <Path d="m13.5 6.5 4 4" />,
]);

export const CheckIcon = createIcon([
  <Path d="m5 12.5 4.2 4.2L19 7" />,
]);

export const CopyIcon = createIcon([
  <Rect x="8" y="8" width="11" height="11" rx="2" />,
  <Path d="M16 8V6.5A1.5 1.5 0 0 0 14.5 5h-8A1.5 1.5 0 0 0 5 6.5v8A1.5 1.5 0 0 0 6.5 16H8" />,
]);

/* -------------------------------------------------------------------------- */
/* Information / status                                                       */
/* -------------------------------------------------------------------------- */

export const InfoIcon = createIcon([
  <Circle cx="12" cy="12" r="9" />,
  <Line x1="12" y1="10.5" x2="12" y2="16.5" />,
  <Line x1="12" y1="7.5" x2="12.01" y2="7.5" />,
]);

export const WarningIcon = createIcon([
  <Path d="m12 3.5 9 17H3l9-17Z" />,
  <Line x1="12" y1="9" x2="12" y2="13.5" />,
  <Line x1="12" y1="17" x2="12.01" y2="17" />,
]);

export const CalendarIcon = createIcon([
  <Rect x="4" y="5.5" width="16" height="15" rx="2" />,
  <Line x1="8" y1="3.5" x2="8" y2="7.5" />,
  <Line x1="16" y1="3.5" x2="16" y2="7.5" />,
  <Line x1="4" y1="10" x2="20" y2="10" />,
]);

export const ClockIcon = createIcon([
  <Circle cx="12" cy="12" r="8.5" />,
  <Path d="M12 7v5l3.5 2" />,
]);

export const LocationIcon = createIcon([
  <Path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />,
  <Circle cx="12" cy="10" r="2.5" />,
]);

/* -------------------------------------------------------------------------- */
/* Utility                                                                     */
/* -------------------------------------------------------------------------- */

export const MailIcon = createIcon([
  <Rect x="3.5" y="5.5" width="17" height="13" rx="2" />,
  <Path d="m4.5 7 7.5 5.5L19.5 7" />,
]);

export const PhoneIcon = createIcon([
  <Path d="M7.5 4.5 5 6c-.8.5-1.1 1.5-.7 2.4 2.2 5.1 6.2 9.1 11.3 11.3.9.4 1.9.1 2.4-.7l1.5-2.5c.4-.7.2-1.6-.5-2l-3-1.7c-.6-.3-1.3-.2-1.8.3l-1.2 1.2a14.7 14.7 0 0 1-3.8-3.8l1.2-1.2c.5-.5.6-1.2.3-1.8l-1.7-3c-.4-.7-1.3-.9-2-.5Z" />,
]);

export const LockIcon = createIcon([
  <Rect x="5" y="10" width="14" height="10" rx="2" />,
  <Path d="M8 10V7a4 4 0 0 1 8 0v3" />,
]);

export const EyeIcon = createIcon([
  <Path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />,
  <Circle cx="12" cy="12" r="2.5" />,
]);