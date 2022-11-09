import {
  createController,
  createControllerMethod,
} from '@becomes/purple-cheetah';
import { HTTPStatus } from '@becomes/purple-cheetah/types';
import { Repo } from '../repo';
import type { Todo } from './model';

export const TodoController = createController({
  name: 'Todo',
  path: '/todo',
  methods() {
    return {
      getAll: createControllerMethod<unknown, { items: Todo[] }>({
        path: '/all',
        type: 'get',
        async handler() {
          return {
            items: await Repo.todo.findAll(),
          };
        },
      }),

      getById: createControllerMethod<unknown, { item: Todo }>({
        path: '/:id',
        type: 'get',
        async handler({ request, errorHandler }) {
          const item = await Repo.todo.findById(request.params.id);
          if (!item) {
            throw errorHandler.occurred(HTTPStatus.NOT_FOUNT, {
              id: request.params.id,
            });
          }
          return { item };
        },
      }),

      search: createControllerMethod<unknown, { items: Todo[] }>({
        path: '/search/:term',
        type: 'get',
        async handler({ request }) {
          return {
            items: await Repo.todo.methods.search(request.params.term),
          };
        },
      }),

      getAllByDone: createControllerMethod<unknown, { items: Todo[] }>({
        path: '/done/:done',
        type: 'get',
        async handler({ request }) {
          return {
            items: await Repo.todo.methods.findAllByDone(
              request.params.done === 'true',
            ),
          };
        },
      }),

      create: createControllerMethod<unknown, { item: Todo }>({
        type: 'post',
        async handler({ request }) {
          return {
            item: await Repo.todo.add(request.body),
          };
        },
      }),

      update: createControllerMethod<unknown, { item: Todo }>({
        type: 'put',
        async handler({ request, errorHandler }) {
          const body = request.body;
          const item = await Repo.todo.findById(body._id);
          if (!item) {
            throw errorHandler.occurred(HTTPStatus.NOT_FOUNT, { id: body._id });
          }
          return {
            item: await Repo.todo.update({
              ...item,
              done: !!body.done,
              description: body.description,
            }),
          };
        },
      }),

      deleteById: createControllerMethod<unknown, { ok: boolean }>({
        path: '/:id',
        type: 'delete',
        async handler({ request }) {
          return {
            ok: await Repo.todo.deleteById(request.params.id),
          };
        },
      }),
    };
  },
});
