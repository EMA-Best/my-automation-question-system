import {GET} from "./ajax"

export async function getQuestionById(id:string) {
    const url = `/api/question/${id}`
    const data = await GET(url)
    return data
}