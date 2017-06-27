const AudioContextMock = require('./audiocontext-mock');
const RequestAnimationFrameMock = require('./requestanimationframe-mock');
const WebGLRendererMock = require('./webglrenderer-mock');

const Game = require('../../Game');

function createGameMock()
{
  AudioContextMock.mock();
  RequestAnimationFrameMock.mock();
  WebGLRendererMock.mock();

  const game = new Game;

  AudioContextMock.clean();
  RequestAnimationFrameMock.clean();
  WebGLRendererMock.clean();

  return game;
}

module.exports = createGameMock;
