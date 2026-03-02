import adaptLesson from '../templates/adapt-lesson.md';
import adaptLessonDeepDive from '../templates/adapt-lesson-deep-dive.md';
import adaptLessonQuickScan from '../templates/adapt-lesson-quick-scan.md';
import deepDiveActivity from '../templates/deep-dive-activity.md';
import onboarding from '../templates/onboarding.md';

const templates: Record<string, string> = {
  'adapt-lesson.md': adaptLesson,
  'adapt-lesson-deep-dive.md': adaptLessonDeepDive,
  'adapt-lesson-quick-scan.md': adaptLessonQuickScan,
  'deep-dive-activity.md': deepDiveActivity,
  'onboarding.md': onboarding,
};

export async function readTemplate(filename: string): Promise<string> {
  const content = templates[filename];
  if (content === undefined) {
    throw new Error(`Unknown template: ${filename}`);
  }
  return content;
}
