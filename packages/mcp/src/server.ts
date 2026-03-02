import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getUserProfileTool } from './tools/get-user-profile.js';
import { setLearningNeedsTool } from './tools/set-learning-needs.js';
import { updateTeachingContextTool } from './tools/update-teaching-context.js';
import { getAvailableTagsTool } from './tools/get-available-tags.js';
import { createMaterialTool } from './tools/create-material.js';
import { simplifyTextTool } from './tools/simplify-text.js';
import { saveLessonAdaptationTool } from './tools/save-lesson-adaptation.js';
import { listMyAdaptationsTool } from './tools/list-my-adaptations.js';
import { recordReflectionTool } from './tools/record-reflection.js';
import { userProfileResource } from './resources/user-profile.js';
import { learningProfileResource } from './resources/learning-profile.js';
import { adaptLessonPrompt } from './prompts/adapt-lesson.js';
import { setupClassroomProfilePrompt } from './prompts/setup-classroom-profile.js';
import { deepDiveActivityPrompt } from './prompts/deep-dive-activity.js';
import instructions from './instructions.md';

export function createMcpServer(context: { userId: string }): McpServer {
  const server = new McpServer(
    {
      name: 'lesson-plan-adapter',
      version: '0.1.0',
    },
    { instructions },
  );

  server.registerTool(
    getUserProfileTool.name,
    {
      description: getUserProfileTool.description,
      inputSchema: getUserProfileTool.inputSchema,
    },
    async () => getUserProfileTool.handler({}, context),
  );

  server.registerTool(
    setLearningNeedsTool.name,
    {
      description: setLearningNeedsTool.description,
      inputSchema: setLearningNeedsTool.inputSchema,
    },
    async (input) => setLearningNeedsTool.handler(input, context),
  );

  server.registerTool(
    updateTeachingContextTool.name,
    {
      description: updateTeachingContextTool.description,
      inputSchema: updateTeachingContextTool.inputSchema,
    },
    async (input) => updateTeachingContextTool.handler(input, context),
  );

  server.registerTool(
    getAvailableTagsTool.name,
    {
      description: getAvailableTagsTool.description,
      inputSchema: getAvailableTagsTool.inputSchema,
    },
    async () => getAvailableTagsTool.handler(),
  );

  server.registerTool(
    createMaterialTool.name,
    {
      description: createMaterialTool.description,
      inputSchema: createMaterialTool.inputSchema,
    },
    async (input) => createMaterialTool.handler(input, context),
  );

  server.registerTool(
    simplifyTextTool.name,
    {
      description: simplifyTextTool.description,
      inputSchema: simplifyTextTool.inputSchema,
    },
    async (input) => simplifyTextTool.handler(input, context),
  );

  server.registerTool(
    saveLessonAdaptationTool.name,
    {
      description: saveLessonAdaptationTool.description,
      inputSchema: saveLessonAdaptationTool.inputSchema,
    },
    async (input) => saveLessonAdaptationTool.handler(input, context),
  );

  server.registerTool(
    listMyAdaptationsTool.name,
    {
      description: listMyAdaptationsTool.description,
      inputSchema: listMyAdaptationsTool.inputSchema,
    },
    async (input) => listMyAdaptationsTool.handler(input, context),
  );

  server.registerTool(
    recordReflectionTool.name,
    {
      description: recordReflectionTool.description,
      inputSchema: recordReflectionTool.inputSchema,
    },
    async (input) => recordReflectionTool.handler(input, context),
  );

  server.registerResource(
    userProfileResource.name,
    userProfileResource.uri,
    { description: userProfileResource.description, mimeType: userProfileResource.mimeType },
    async (uri) => userProfileResource.handler(uri, context),
  );

  server.registerResource(
    learningProfileResource.name,
    learningProfileResource.uri,
    {
      description: learningProfileResource.description,
      mimeType: learningProfileResource.mimeType,
    },
    async (uri) => learningProfileResource.handler(uri, context),
  );

  server.registerPrompt(
    adaptLessonPrompt.name,
    { description: adaptLessonPrompt.description, argsSchema: adaptLessonPrompt.arguments },
    async (arguments_) => adaptLessonPrompt.handler(arguments_, context),
  );

  server.registerPrompt(
    setupClassroomProfilePrompt.name,
    {
      description: setupClassroomProfilePrompt.description,
      argsSchema: setupClassroomProfilePrompt.arguments,
    },
    async () => setupClassroomProfilePrompt.handler({} as Record<string, never>, context),
  );

  server.registerPrompt(
    deepDiveActivityPrompt.name,
    {
      description: deepDiveActivityPrompt.description,
      argsSchema: deepDiveActivityPrompt.arguments,
    },
    async (arguments_) => deepDiveActivityPrompt.handler(arguments_, context),
  );

  return server;
}
