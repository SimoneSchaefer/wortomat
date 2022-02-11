export function getAllEnumValues(enumType) {
    const allValues = [];
    for (const value in enumType) {
        if (isNaN(Number(value))) allValues.push(value)
    }
    return allValues;
}
