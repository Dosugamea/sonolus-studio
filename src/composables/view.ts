import { computed, Ref, toRef } from 'vue'
import { ProjectItemTypeOf } from '../core/project'
import { clone } from '../core/utils'
import { useState } from './state'

export function useView<T, U = T>(
    props: { data: T },
    type: ProjectItemTypeOf<T>,
    getter?: (v: Ref<T>, view: Ref<string[]>) => U
): Ref<U> {
    const { project, push, view } = useState()

    const v = toRef(bind(props), 'data')
    return getter ? computed(() => getter(v, view)) : v

    function bind<T extends Record<string, unknown>>(
        data: T,
        path = [] as string[]
    ) {
        const output = {}
        for (const key in data) {
            const keyPath = [...path, key]
            Object.defineProperty(output, key, {
                get: () => {
                    const value = data[key]
                    return typeof value === 'object'
                        ? bind(value as Record<string, unknown>, keyPath)
                        : value
                },
                set: (value) => {
                    const oldValue = data[key]
                    if (oldValue === value) return

                    update(keyPath, value)
                },
            })
        }
        return output as T
    }

    function update(path: string[], value: unknown) {
        const newProps = clone(props)
        path.reduce(
            (data, key, index) =>
                index === path.length - 1 ? (data[key] = value) : data[key],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newProps as any
        )

        const items = new Map(project.value[type] as never)
        items.set(view.value[1], newProps.data)

        push(
            {
                ...project.value,
                view: view.value,
                [type]: items,
            },
            path.join('.')
        )
    }
}
