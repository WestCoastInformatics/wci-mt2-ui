import { CodeUtility } from 'src/app/utilities/code.utility';

/**
 * Debounce a method
 */
export function Debounce(milliseconds = 800) {

  return function (target: any, key: any, descriptor: any) {

    const oldFunction = descriptor.value
    const newFunction = CodeUtility.debounce(oldFunction, milliseconds)

    descriptor.value = function () {
      return newFunction.apply(this, arguments)
    }
  }
}