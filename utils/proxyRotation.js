const proxy_rotation = async (data) => {
    let length = data.length;
    let random_index = Math.floor(Math.random(length) * length);
    return data[random_index];
}

module.exports = proxy_rotation;
