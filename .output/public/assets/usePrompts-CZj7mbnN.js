import{n as e}from"./client-JNFkalRR.js";import{n as t}from"./useMutation-CAi2_fXj.js";function n(){return t({queryKey:[`prompts`,`public`],queryFn:async()=>{let{data:t,error:n}=await e.from(`prompts`).select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `).eq(`is_public`,!0).order(`rating_avg`,{ascending:!1}).order(`rating_count`,{ascending:!1}).order(`created_at`,{ascending:!1});if(n)throw Error(n.message);return t.map(e=>({...e,author:e.profiles||null,profiles:void 0}))}})}export{n as t};