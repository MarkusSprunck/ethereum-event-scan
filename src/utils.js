/**
 * The class Utils provides methods for string manipulation
 */
class Utils {

    /**
     * Creates a human readable time format
     */
    static convertTimestamp(time) {
        const d = new Date(time * 1000);
        const yy = d.getFullYear();
        const MM = ('0' + (d.getMonth() + 1)).slice(-2);
        const dd = ('0' + d.getDate()).slice(-2);
        const hh = ('0' + d.getHours()).slice(-2);
        const mm = ('0' + d.getMinutes()).slice(-2);
        const ss = ('0' + d.getSeconds()).slice(-2);
        return dd + '.' + MM + '.' + yy + ' ' + hh + ':' + mm + ':' + ss + 'h';
    }

    /**
     * Truncate middle part of string in the case it exceeds the maximum length
     */
    static truncate(str, maxLength) {
        if (str.length <= maxLength) {
            return str;
        }
        let left = Math.ceil(maxLength / 2);
        let right = str.length - Math.floor(maxLength / 2) + 2;
        return str.substr(0, left) + "…" + str.substring(right);
    }

    /**
     *  Replaces all spaces with non breaking spaces in html
     */
    static spaces(value) {
        return value.replace(/\s/g, '&nbsp;')
    }

    /**
     * Sleep time expects milliseconds
     */
    static sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

}

module.exports = Utils;