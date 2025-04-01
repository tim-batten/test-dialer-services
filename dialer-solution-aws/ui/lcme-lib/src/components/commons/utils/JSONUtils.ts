/**
 *
 * @param accessors
 * @param object
 * @returns value form the object
 */
export const multipleStringAccessorExtractor = (
  accessors: string,
  object: object,
): any => {
  let accessors_arr = accessors.split('.');
  let object_value = object;

  for (let index = 0; index < accessors_arr.length; index++) {
    const accessor = accessors_arr[index];
    if (object_value === undefined) {
      break;
    }
    object_value = object_value[accessor];
  }
  return object_value;
};
export const to1stCapital = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}