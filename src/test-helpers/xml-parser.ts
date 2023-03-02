import { XMLParser, XmlBuilderOptions } from 'fast-xml-parser';

const defaultOption: Partial<XmlBuilderOptions> = {
    ignoreAttributes : false,
    suppressBooleanAttributes: false,
    format: true,
    attributesGroupName: '@attributes',
    textNodeName: '@text',
    attributeNamePrefix: ''
};

export function jsonFromXml(xml: any, options: Partial<XmlBuilderOptions> = defaultOption) {
    const xmlParser = new XMLParser(options);
    return xmlParser.parse(xml);
}