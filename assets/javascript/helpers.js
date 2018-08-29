var base_id = 1;
var hover_interval;

Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
};

function next_id() {
    return base_id++;
}