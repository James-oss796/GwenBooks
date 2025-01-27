
import BookOverview from "@/components/BookOverview";
import BookList from "@/components/BookList";
import { sampleBooks } from "@/constants";
import { db } from "@/DATABASE/drizzle";
import { users } from "@/DATABASE/schema"

 const Home = async() =>{
  const result = await db.select().from(users);

  console.log(JSON.stringify(result, null, 2));

  return(<>
     
    <BookOverview { ...sampleBooks[5]}/>
    <BookList 
      title = "Latest Books"
      books={sampleBooks}
      containerClassName = "mt-28"
    />
    </>)
 };


export default Home;
