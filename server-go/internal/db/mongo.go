package db

import (
	"context"
	"log"
	"sync/atomic"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var isConnected atomic.Bool

func Connected() bool {
	return isConnected.Load()
}

func Connect(uri string) *mongo.Database {
	if uri == "" {
		log.Println("⚠️ MONGODB_URL is empty. Server will run; database features will wait for MONGODB_URL.")
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Printf("⚠️ Mongo connect error: %v. Server will continue running.", err)
		return nil
	}

	if err := client.Ping(ctx, nil); err != nil {
		log.Printf("⚠️ Mongo ping warning: %v. Database will keep retrying in background.", err)
		go func() {
			for {
				time.Sleep(10 * time.Second)
				tCtx, tCancel := context.WithTimeout(context.Background(), 5*time.Second)
				pErr := client.Ping(tCtx, nil)
				tCancel()
				if pErr == nil {
					log.Println("✅ DataBase Connected Successfully (reconnected)")
					isConnected.Store(true)
					return
				}
			}
		}()
	} else {
		log.Println("✅ DataBase Connected Successfully")
		isConnected.Store(true)
	}

	return client.Database("interviewiq")
}
