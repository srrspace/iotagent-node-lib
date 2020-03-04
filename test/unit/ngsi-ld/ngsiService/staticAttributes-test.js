/*
 * Copyright 2020 Telefonica Investigación y Desarrollo, S.A.U
 *
 * This file is part of fiware-iotagent-lib
 *
 * fiware-iotagent-lib is free software: you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 *
 * fiware-iotagent-lib is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with fiware-iotagent-lib.
 * If not, see http://www.gnu.org/licenses/.
 *
 * For those usages not covered by the GNU Affero General Public License
 * please contact with::[contacto@tid.es]
 *
 * Modified by: Jason Fox - FIWARE Foundation
 */

const iotAgentLib = require('../../../../lib/fiware-iotagent-lib');
const async = require('async');
const should = require('should');
const logger = require('logops');
const nock = require('nock');
let contextBrokerMock;
const iotAgentConfig = {
    contextBroker: {
        host: '192.168.1.1',
        port: '1026',
        ngsiVersion: 'ld',
        jsonLdContext: 'http://context.json-ld'
    },
    server: {
        port: 4041
    },
    types: {
        Light: {
            commands: [],
            type: 'Light',
            lazy: [
                {
                    name: 'temperature',
                    type: 'centigrades'
                }
            ],
            active: [
                {
                    name: 'pressure',
                    type: 'Hgmm'
                }
            ],
            staticAttributes: [
                {
                    name: 'attr1',
                    type: 'type1'
                },
                {
                    name: 'attr2',
                    type: 'type2'
                },
                {
                    name: 'attr3',
                    type: 'type3'
                },
                {
                    name: 'attr4',
                    type: 'type4'
                }
            ]
        }
    },
    timestamp: true,
    service: 'smartGondor',
    subservice: 'gardens',
    providerUrl: 'http://smartGondor.com'
};

xdescribe('NGSI-LD - Static attributes test', function() {
    const values = [
        {
            name: 'state',
            type: 'boolean',
            value: true
        },
        {
            name: 'dimming',
            type: 'number',
            value: 87
        }
    ];

    beforeEach(function() {
        logger.setLevel('FATAL');
    });

    afterEach(function(done) {
        iotAgentLib.deactivate(done);
    });

    describe('When information from a device with multiple static attributes and metadata is sent', function() {
        beforeEach(function(done) {
            nock.cleanAll();

            contextBrokerMock = nock('http://192.168.1.1:1026')
                .matchHeader('fiware-service', 'smartGondor')
                .patch('/ngsi-ld/v1/entities/light1/attrs')
                .query({ type: 'Light' })
                .times(4)
                .reply(204)
                .patch('/ngsi-ld/v1/entities/light1/attrs', function(body) {
                    let metadatas = 0;
                    for (const i in body) {
                        if (body[i].metadata) {
                            metadatas += Object.keys(body[i].metadata).length;
                        }
                    }
                    return metadatas === Object.keys(body).length - 1;
                })
                .query({ type: 'Light' })
                .reply(204);

            iotAgentLib.activate(iotAgentConfig, done);
        });

        it('should send a single TimeInstant per attribute', function(done) {
            async.series(
                [
                    async.apply(iotAgentLib.update, 'light1', 'Light', '', values),
                    async.apply(iotAgentLib.update, 'light1', 'Light', '', values),
                    async.apply(iotAgentLib.update, 'light1', 'Light', '', values),
                    async.apply(iotAgentLib.update, 'light1', 'Light', '', values),
                    async.apply(iotAgentLib.update, 'light1', 'Light', '', values)
                ],
                function(error, results) {
                    should.not.exist(error);
                    contextBrokerMock.done();
                    done();
                }
            );
        });
    });
});