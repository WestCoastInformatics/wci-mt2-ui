import * as moment from 'moment';

export class CodeUtility {

    static TIME_FORMAT = "HH:mm:ss A";
    static TIME_FORMAT_24_HOUR = "HH:mm:ss";
    static DATE_FORMAT_US_STANDARD = "MM/DD/YYYY";
    static DATE_FORMAT_US_STANDARD_ONLY_NUMBERS = "MMDDYYYY";
    static DATE_FORMAT_US_STANDARD_WITH_TIME = CodeUtility.DATE_FORMAT_US_STANDARD + " " + CodeUtility.TIME_FORMAT;
    static DATE_FORMAT_US_STANDARD_WITH_24_HOUR_TIME = CodeUtility.DATE_FORMAT_US_STANDARD + " " + CodeUtility.TIME_FORMAT_24_HOUR;
    static DATE_FORMAT_REVERSE = "YYYY-MM-DD";
    static DATE_FORMAT_REVERSE_ONLY_NUMBERS = "YYYYMMDD";
    static DATE_FORMAT_REVERSE_WITH_TIME = CodeUtility.DATE_FORMAT_REVERSE + " " + CodeUtility.TIME_FORMAT;
    static DATE_FORMAT_REVERSE_WITH_24_HOUR_TIME = CodeUtility.DATE_FORMAT_REVERSE + " " + CodeUtility.TIME_FORMAT_24_HOUR;

    /*
     * getUniqueID - return a string representing the current time to the nano second
     */
    static getUniqueID() {
        return window.crypto.getRandomValues(new Uint32Array(1))[0];
    }

    /*
     * isConceptID - return a boolean if the passed ID is a concept ID or not.
     */
    static isConceptID(id) {
        return id.match(/[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}/) != null;
    }

    /*
     * addIfNotEmpty - return the original string with the specified string added to the beginning or end (default) if the original is not empty.
     */
    static addIfNotEmpty(originalString: string, stringToAdd: string, addToEnd: boolean = true): string {

        if (this.hasValue(originalString)){

            if (addToEnd){
                return originalString + stringToAdd;
            } else {
                return stringToAdd + originalString;
            }
            
        } else {
            return originalString;
        }
    }

    /*
     * removeFinal - return the string with the specified characters removed if they are the last characters in the string or followed only by whitespace.
     */
    static removeFinal(str: string, charsToRemove: string): string {

        let  regex = new RegExp(`${charsToRemove}\s*$`);
        return str.replace(regex, "");
    }

    /*
     * hasValue - return a boolean if passed variable has a legitimate value (not undefined, null, or possibly empty string.
     * variable - the variable to test
     * rejectEmpty - a boolean to set if the function should count empty strings or empty objects as non-valid values. Defaults to true
     */
    static hasValue(variable, rejectEmpty: boolean = true) {

        if (variable == undefined || variable == null || (rejectEmpty && (variable === '' || (Object.keys(variable).length === 0 && (Array.isArray(variable) || variable.constructor === Object))))) {
            return false;
        } else {
            return true;
        }
    }

    /*
     * Returns a function, that, as long as it continues to be invoked, will not be triggered. The function will be called after it stops
     * being called for N milliseconds. If `immediate` is passed, trigger the function on the leading edge, instead of the trailing.
     */
    static debounce(func, wait, immediate) {

        let timeout;

        return function () {

            let context = this, args = arguments;

            let later = function () {

                timeout = null;
                if (!immediate) func.apply(context, args);
            };

            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) {
                func.apply(context, args);
            }
        };
    };

    /*
     * testBoolean - return a boolean given an boolean or string representation of a boolean - all others return null.
     */
    static testBoolean(testValue) {

        if (testValue == undefined || testValue == null) {
            return false;
        }

        if (testValue === "true" || testValue === 1 || testValue === true) {
            return true;

        } else if (testValue === "false" || testValue === -1 || testValue === 0 || testValue === false) {
            return false;

        } else {
            return null;
        }
    }

    /*
     * isInt - test if the passed object is an integer
     * @param [string] value - the value to test.
     * @return - boolean if the value is an integer
     */
    static isInt(value) {

        return /^-?[0-9]+$/.test(value);
    }

    /*
     * isFloat - test if the passed object is an float
     * @param [string] value - the value to test.
     * @return - boolean if the value is an float
     */
    static isFloat(value) {

        return +value === value && (!isFinite(value) || !!(value % 1));
    }

    /*
     * findInArray - return a boolean if at least one item in itemsToFind is present in an array.
     */
    static findInArray(arrayToSearch, itemsToFind) {

        return itemsToFind.some(function (value) {
            return arrayToSearch.indexOf(value) >= 0;
        });
    }

    /*
     * stripHtml - return a string with all HTML tags removed from it.
     */
    static stripHtml(html){

        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
     }

    /*
     * clone - return cloned copy of the object with new object references. Cannot process circular references
     */
    static clone(object){

        return JSON.parse(JSON.stringify(object));
     }

     /*
     * textOverflow - return a string up to a certain number of characters with '...' at the end if it excedes the limit.
     */
    static textOverflow(text: string, characterLimit: number){

        if (text.length <= characterLimit){
            return text;
        } else {
            return text.substr(0, characterLimit) + ' ...';
        }
     }

    /*
     * toTitleCase - return the supplied string in title case.
     */
    static toTitleCase(string, separator, splitter) {

        if (separator == undefined || separator == null) {
            separator = '_';
        }

        if (splitter == undefined || splitter == null) {
            splitter = ' ';
        }

        return string
            .toLowerCase()
            .split(separator)
            .map(function (word) {
                return word.charAt(0).toUpperCase() + word.substr(1);
            })
            .join(splitter);
    }

    static parseJsonDate(jsonDate) {

        if (this.hasValue(jsonDate)){
            
            let date = moment.unix(jsonDate/1000)

            if (date.isValid()) {
                return date.utc();
            } else {
                return jsonDate;
            }
        } else {
            return jsonDate;
        }
        
    }

    static formatJsonDate(jsonDate: string, format: string = this.DATE_FORMAT_REVERSE_WITH_24_HOUR_TIME) {

        let date = this.parseJsonDate(jsonDate);

        if (date !== jsonDate){
            return date.format(format);
        } else {
            return jsonDate;
        }
    }

    /*
     * compareDates - return a positive number of milliseconds if the first date is after the second, otherwise a negative number.
     */
    static compareDates(firstDate, secondDate, format = this.DATE_FORMAT_US_STANDARD_WITH_24_HOUR_TIME) {

        let momentDateA = moment(firstDate, format);
        let momentDateB = moment(secondDate, format);

        return momentDateA.diff(momentDateB);
    }

    /*
     * getCurrentDate - get the current date in the specified format.
     */
    static getCurrentDate(format = this.DATE_FORMAT_REVERSE) {

        let momentDate = moment();
        return momentDate.format(format);
    }

    /*
    * getUrlString - get a properly url-encoded query string of an object.
    */
    static getUrlString(params, keys = [], isArray = false) {

        let b = { a: 1, b: { c: [1, 2], d: 'property' } };

        let urlString = Object.keys(params).map(key => {

            // get the param value
            let value = params[key];

            // if the value is an object or an array call this function again with the value and the key name if it's an object, otherwise process the value 
            if ("[object Object]" === Object.prototype.toString.call(value) || Array.isArray(value)) {

                if (!this.hasValue(value)) {
                    return;
                }

                // if the params is an array set the key to an empty string, otherwise set it to the current key name
                if (Array.isArray(params)) {
                    keys.push("");
                } else {
                    keys.push(key);
                }

                return this.getUrlString(value, keys, Array.isArray(value));

            } else {


                let transfomedKey = key;

                // if this was a nested array or object
                if (keys.length > 0) {

                    let allKeys;

                    // if this is an array just use the keys passed in, if it's an object also add the current key
                    if (isArray) {
                        allKeys = keys
                    } else {
                        allKeys = [...keys, key];
                    }

                    // get the proper format for the key
                    transfomedKey = allKeys.reduce(
                        (keyName, i) => {

                            // if this is an array just return the index, else return the keyname and index in object format
                            if ("" === keyName) {
                                return i;
                            } else {
                                return `${keyName}[${i}]`;
                            }
                        },
                        ""
                    );
                }

                if (isArray) {
                    return encodeURI(`${transfomedKey}[]=${value}`);
                } else {
                    return encodeURI(`${transfomedKey}=${value}`);
                }

            }
        }).filter(function (element) {
            return element != null;
        }).join('&')

        return urlString;
    }

    /*
     * serialize - get a properly url-encoded query string of an object.
     */
    static serialize(obj, prefix?) {

        let str = [];
        let param;

        for (param in obj) {

            if (obj.hasOwnProperty(param)) {

                let key = prefix ? prefix + "[" + param + "]" : param;
                let value = obj[param];

                if (value !== null && typeof value === "object") {

                    if (!this.hasValue(value)) {
                        continue;
                    }

                    str.push(this.serialize(value, key));
                } else {
                    str.push((encodeURIComponent(key) + "=" + encodeURIComponent(value)));
                }
            }
        }

        return str.join("&");
    }

    /*
     * getParamsAsObject - take an encoded query string and turn it into a proper object representation.
     */
    static getParamsAsObject(query) {

        query = query.substring(query.indexOf('?') + 1);

        let regex = /([^&=]+)=?([^&]*)/g;
        let decodeRE = /\+/g;

        let decode = function (str) {
            return decodeURIComponent(str.replace(decodeRE, " "));
        };

        let params = {};
        let expression;

        while (expression = regex.exec(query)) {

            let key = decode(expression[1]);
            let value = decode(expression[2]);

            if (key.substring(key.length - 2) === '[]') {

                key = key.substring(0, key.length - 2);
                (params[key] || (params[key] = [])).push(value);
            }

            else params[key] = value;
        }

        let assign = function (obj, keyPath, value) {

            let lastKeyIndex = keyPath.length - 1;

            for (let i = 0; i < lastKeyIndex; ++i) {

                let key = keyPath[i];

                if (!(key in obj)) {
                    obj[key] = {}
                }

                obj = obj[key];
            }

            obj[keyPath[lastKeyIndex]] = value;
        }

        for (let property in params) {

            let structure = property.split('[');

            if (structure.length > 1) {

                let levels = [];

                structure.forEach(function (item, i) {
                    let key = item.replace(/[?[\]\\ ]/g, '');
                    levels.push(key);
                });

                assign(params, levels, params[property]);
                delete (params[property]);
            }
        }

        return params;
    }
}