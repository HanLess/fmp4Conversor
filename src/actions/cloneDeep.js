var cloneDeep = function (obj) {
    var str = JSON.stringify(obj)

    return JSON.parse(str)
}

export default cloneDeep