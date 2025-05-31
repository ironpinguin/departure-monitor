export interface LineStyle {
  "background-color"?: string | null;
  color?: string | null;
  "background-image"?: string | null;
  "background-repeat"?: string | null;
  "background-position"?: string | null;
  "background-size"?: string | null;
}

export interface GroupStyle {
  color?: string | null;
  "background-color"?: string | null;
  "border-radius"?: string | null;
  "padding"?: string | null;
}

export interface GroupsStyle {
  default: GroupStyle;
  [key: string]: GroupStyle;
}

export interface LinesStyle {
  [key: string]: LineStyle;
}

export interface StylesData {
  lines: LinesStyle;
  groups: GroupsStyle;
}

export interface StylesConfig {
  muc: StylesData;
  wue: StylesData;
}