const localizerRegistry: ClassEnumMap = {}

interface ClassEnumMap {
  [className: string]: AttributeEnumMap | undefined
}

interface AttributeEnumMap {
  [attribute: string]: EnumValueMap | undefined
}

interface EnumValueMap {
  [enumValue: string]: string | undefined
}

export function registerAttributeEnumMap(
  className: string,
  attributeEnumMap: AttributeEnumMap,
) {
  localizerRegistry[className] = attributeEnumMap
}

export function translateEnum(
  className: string,
  attribute: string,
  enumValue: string,
): string | null {
  const attributeEnumMap = localizerRegistry[className]
  if (!attributeEnumMap) return null

  const enumValueMap = attributeEnumMap[attribute]
  if (!enumValueMap) return null

  const translated = enumValueMap[enumValue]
  if (typeof translated !== 'string') return null

  return translated
}

export function localizeData<T extends Record<string, unknown>>(
  className: string,
  data: T,
): T {
  const localizedData: Record<string, string> = {}

  Object.entries(data).forEach(([name, value]) => {
    if (typeof value !== 'string') return

    const localized = translateEnum(className, name, value)
    if (localized !== null) localizedData[`${name}Localized`] = localized
  })

  return { ...data, ...localizedData }
}
