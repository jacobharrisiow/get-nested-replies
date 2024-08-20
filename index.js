import got from 'got'
import { configDotenv } from 'dotenv'

configDotenv()


export async function getReplies(postId, limit) {
  const response = await got.post(process.env.GRAPHQL_HOST ?? '', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.BEARER_TOKEN ?? ''}`,
    },
    json: {
      query: `query {
    replies(postId: "${postId}", limit: ${limit}) {
        nodes {
            id
            textContent
            repliesCount
            createdBy {
                member {
                    id
                    name
                    email
                }
            }
        }
    }
}`,
      variables: {},
    },
  })
  const data = JSON.parse(response.body)
  const replies = data.data.replies.nodes
  return replies
  
}

async function fetchRepliesTree(postId, limit) {
  const replies = await getReplies(postId, limit)

  for (const reply of replies) {
    reply.replies = await fetchRepliesTree(reply.id, limit)
  }

  return replies
}

async function fetchPostWithReplies(postId, limit = 10) {
  const rootPost = {
    id: postId,
    textContent: '',
    createdBy: {
      id: '',
      name: '',
      email: '',
    },
  }

  rootPost.replies = await fetchRepliesTree(postId, limit)

  return rootPost
}

fetchPostWithReplies(process.env.POST_ID ?? '').then(p => {
  console.log(JSON.stringify(p, null, 2))
})