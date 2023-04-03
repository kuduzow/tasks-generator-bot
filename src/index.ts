import { Telegraf, Markup } from 'telegraf';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.model';
import Task, { ITask } from './models/Task.model';
import Log from './models/Log.model';

dotenv.config();

const maxTasksPerDay = Number(process.env.MAX_TASKS_PER_DAY ?? 10);

mongoose
  .connect(process.env.MONGODB_URI ?? '')
  .then(() => {
    console.log('Mongo connected');

    const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN ?? '');

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const generateRequestKeyboard = Markup.keyboard([
      ['Новая задача'],
    ]).resize();

    bot.start(async (ctx) => {
      const { id, first_name } = ctx.message.from;

      let user = await User.findOne({ telegramId: id });

      if (!user) {
        user = await User.create({
          telegramId: id,
          firstName: first_name,
          extraData: JSON.stringify(ctx.message),
        });
      }

      ctx.reply(
        'Мы создали этот бот, чтобы ты мог потренироваться в решении задач на основы JavaScript.\n\n' +
          'Бот работает в тестовом режиме. Некоторые задачи могут оказаться неточными или слишком сложными.\n\n' +
          'В течение суток можно сгенерировать ' +
          maxTasksPerDay +
          +' задач.\n\n' +
          'Если есть идеи по улучшению или замечания, то пиши на почту ammya@ya.ru',
        generateRequestKeyboard
      );
    });

    bot.hears('Новая задача', async (ctx) => {
      // Отправляем сигнал "печатает..."
      await ctx.sendChatAction('typing');

      const { id } = ctx.message.from;

      let user = await User.findOne({ telegramId: id });

      const tasks = await getTasksForCurrentDay(user?._id);

      if (tasks.length >= 10) {
        return ctx.reply(
          'На сегодня больше не осталось новых попыток. Лимит сбросится в полночь.'
        );
      }

      const prompt =
        'Сгенерируй задачу по JavaScript на знание массивов или функций или цикла `for` или if-else. Подбери неординарную задачу. Уровень слабее junior.';

      const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.9,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      await Task.create({
        content: response.data.choices[0].message?.content,
        user: user?._id,
      });

      ctx.reply(response.data.choices[0].message?.content ?? '');
    });

    bot.on('message', async (ctx) => {
      console.log(`Requested by: ${ctx.message.from.first_name}`, ctx.message);

      await Log.create({
        author: ctx.message.from.first_name,
        message: JSON.stringify(ctx.message),
      });

      ctx.reply(
        'Я не понимаю тебя. Попробуй еще раз. Пришли мне сообщение "Новая задача".'
      );
    });

    bot.launch();
    console.log('Bot started');

    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
  })
  .catch((err) => {
    console.log('Mongo connect error: ', err);
  });

async function getTasksForCurrentDay(userId: string): Promise<ITask[]> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const tasks = await Task.find({
    user: userId,
    createdAt: {
      $gte: startOfToday,
      $lt: startOfTomorrow,
    },
  });

  return tasks;
}
