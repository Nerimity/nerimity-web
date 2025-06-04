export function arrayMove<T = string>(
  arr: T[],
  oldIndex: number,
  newIndex: number
) {
  const length = arr.length;
  if (oldIndex === newIndex || oldIndex >= length || newIndex >= length) {
    return arr;
  }

  const newArr = arr.slice();
  const [itemToMove] = newArr.splice(oldIndex, 1);
  newArr.splice(newIndex, 0, itemToMove!);
  return newArr;
}
