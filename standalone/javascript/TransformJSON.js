/*

 Author: Udhayamoorthy
 Email: udhayaraagam@gmail.com"

 */

//Code start

function prepareGroup(inputObj, flatted, sourceXpath) {
    sourceXpath = sourceXpath.replace(/\[]/g, ".[0-9]*");
    var reg = new RegExp(sourceXpath, "g")
    var strVal = JSON.stringify(flatted).match(reg);
    var groupVal = {};
    if (strVal != null)
        strVal.forEach(function (data) {
            if (flatted[data] != undefined) {
                groupVal[data] = flatted[data];
            } else {
                data = data.replace(/"/g, "");
                groupVal[data] = getValue(inputObj, data);
            }
        })
    return groupVal;
}

function processGrouped(obj, targetXpath) {
    var flatOutput = {};
    var keys = Object.keys(obj);
    targetXpath = targetXpath.replace(/\[]./g, "[0-9]");
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var changed = key.match(/(^[0-9]*\.|\W[0-9]*\.)/g);
        if (changed) {
            changed = JSON.stringify(changed).replace(/\"\./g, "\"");
        }
        var arrapos = '';
        try {
            arrapos = JSON.parse(changed);
        }
        catch (e) {
            arrapos = changed;
        }
        var temp = targetXpath;
        if (arrapos != null) {
            arrapos.forEach(function (pos) {
                pos = "." + pos;
                temp = temp.replace("[0-9]", pos)
            })
        }
        //tinkering - started
        if (temp.charAt(0) == ".") {
            temp = temp.substring(1, temp.length);
        }
        //tinkering - end
        flatOutput[temp] = obj[key];
    }
    return unflatten(flatOutput);
}

function merge(a, b) {
    for (var key in b)
        if (b.hasOwnProperty(key)) {
            var src = a[key];
            var dest = b[key];
            if (typeof src === 'object' && typeof dest === 'object') {
                merge(src, dest);
            } else {
                a[key] = b[key];
            }
        }
    return a;
};

function getValue(localObj, xpath) {
    //var localObj = JSON.parse(JSON.stringify(obj));
    var xpathArr = xpath.split('.');
    xpathArr.forEach(function (path) {
        localObj = localObj[path];
    })
    return localObj;
}

function unflatten(target, opts) {
    var opts = opts || {}
        , delimiter = opts.delimiter || '.'
        , result = {}

    if (Object.prototype.toString.call(target) !== '[object Object]') {
        return target
    }

    function getkey(key) {
        var parsedKey = parseInt(key)
        return (isNaN(parsedKey) ? key : parsedKey)
    };

    Object.keys(target).forEach(function (key) {
        var split = key.split(delimiter)
            , firstNibble
            , secondNibble
            , recipient = result

        firstNibble = getkey(split.shift())
        secondNibble = getkey(split[0])

        while (secondNibble !== undefined) {
            if (recipient[firstNibble] === undefined) {
                recipient[firstNibble] = ((typeof secondNibble === 'number') ? [] : {})
            }

            recipient = recipient[firstNibble]
            if (split.length > 0) {
                firstNibble = getkey(split.shift())
                secondNibble = getkey(split[0])
            }
        }

        // unflatten again for 'messy objects'
        recipient[firstNibble] = unflatten(target[key])
    });

    //Array Check
    var keys = Object.keys(result);
    if (keys.length > 0 && keys[0] === "0") {
        var output = [];
        keys.forEach(function (key) {
            output.push(result[key])
        });
        return output;
    }
    return result
};

function flatten(target, opts) {
    var output = {}
        , opts = opts || {}
        , delimiter = opts.delimiter || '.'

    function getkey(key, prev) {
        return prev ? prev + delimiter + key : key
    };

    function step(object, prev) {
        Object.keys(object).forEach(function (key) {
            var isarray = opts.safe && Array.isArray(object[key])
                , type = Object.prototype.toString.call(object[key])
                , isobject = (type === "[object Object]" || type === "[object Array]")

            if (!isarray && isobject) {
                return step(object[key]
                    , getkey(key, prev)
                )
            }

            output[getkey(key, prev)] = object[key]
        });
        if (Object.keys(object) == "") {
            if (object instanceof Array) {
                output[prev] = [];
            } else {
                output[prev] = {};
            }
        }
    };
    step(target)
    return output
};

function transformJSON(inputObj, mapArray) {
    var flatted = flatten(inputObj);
    var finalout = {};
    if (mapArray.length > 0 && (mapArray[0].targetXpath).charAt(0) == "[")
        finalout = [];
    mapArray.forEach(function (map) {
        var grouped = prepareGroup(inputObj, flatted, map.sourceXpath);
        var output = processGrouped(grouped, map.targetXpath);
        finalout = merge(finalout, output);  // merge two json objects
    });
    return finalout;
}

//Code end

//How to use??

var inputObj = {
    a: {
        b: [
            {
                Name: "Tommy",
                Location: [
                    {Place: "Sydney"},
                    {Place: "Washington"}
                ],
                Info: {age: 23}
            },
            {
                Name: "Sara",
                Location: [
                    {Place: "New York"},
                    {Place: "New Jercy"}
                ],
                Info: {age: 34}
            },
            {
                Name: "John",
                Location: [
                    {Place: "Chicago"},
                    {Place: "Detroit"}
                ],
                Info: {age: 78}
            }
        ],
        d: {
            e: {
                f: {
                    g: {
                        h: "I Love India"
                    }
                }
            }
        }
    }
};

var mapArray = [];     // collect source and target xpath s
var obj = {};
obj.sourceXpath = "a.b[].Name"; // Name is string
obj.targetXpath = "x[].NewName"; // expecting NewName as string
mapArray.push(obj);

//obj = {};
//obj.sourceXpath = "a.b[].Location"; // Location is an array
//obj.targetXpath = "x[].NewName"; // INVALID MAPPING - NewName already mapped
//mapArray.push(obj);

obj = {};
obj.sourceXpath = "a.b[].Location"; // Location is an array
obj.targetXpath = "x[].NewLocation"; // Location data copied to NewLocation array(Place will be present in array elements)
mapArray.push(obj);

obj = {};
obj.sourceXpath = "a.b[].Location[].Place"; // Location is an array
obj.targetXpath = "x[].NewLocation[].NewPlace"; // NewPlace will be created parallel to existing Place.
mapArray.push(obj);

obj = {};
obj.sourceXpath = "a.d.e.f.g.h"; // Transforming attributes at different level
obj.targetXpath = "T.H";
mapArray.push(obj);

var finalout = transformJSON(inputObj, mapArray);

console.log("Transformed JSON = " + JSON.stringify(finalout));

/*

 We can transfer JSON array to JSON object and vice versa. The only thing is we need to be careful in defining the xPaths.

 //Transforming JSON array to JSON object:
 var inputObj = [{Name:"Senyora"},{Name:"Clinton"}]
 sourceXpath = "[].Name";
 targetXpath = "Marriage.Couples[].NewName";
 // Output = {Marriage:{Couples:[{NewName:"Senyora"},{NewName:"Clinton"}]}}


 //Transforming JSON object to JSON array:
 var inputObj = {Marriage:{Couples:[{NewName:"Senyora"},{NewName:"Clinton"}]}}
 sourceXpath = "Marriage.Couples[].NewName";
 targetXpath = "[].Name";
 // Output = [{Name:"Senyora"},{Name:"Clinton"}]

 Note:
 xPath '[].Name' denotes array of object(s) with attribute 'Name'   // [{Name:"John"}]
 xPath 'x[].Name' denotes object contains array with key 'x'     // {x:[{Name:"Stephen"}]}

 Caution:
 JSON can't be transformed between different dimensions of array. Count of '[]' in sourceXpath should be equals to count of '[]' in targetXpath and vice versa.

 */
