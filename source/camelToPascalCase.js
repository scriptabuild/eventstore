module.exports = function camelToPascalCase(camelcaseString) {
	return camelcaseString[0].toUpperCase() + camelcaseString.substring(1);
}